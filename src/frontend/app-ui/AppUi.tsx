/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config, OpenMode } from "@bentley/bentleyjs-core";
import { HubIModel } from "@bentley/imodelhub-client";
import {
  AuthorizedFrontendRequestContext,
  BriefcaseConnection,
  IModelApp,
  IModelConnection,
  RemoteBriefcaseConnection,
  ViewState,
} from "@bentley/imodeljs-frontend";
import {
  BackstageManager,
  CommandItemDef,
  ConfigurableUiManager,
  FrontstageManager,
  SyncUiEventDispatcher,
  UiFramework,
} from "@bentley/ui-framework";
import { TestDeSerializationView } from "./frontstages/Feature";
import { SampleFrontstage } from "./frontstages/SampleFrontstage";
import { ClearSelectedDevice } from "./widgets/DeviceTree";
interface iModelIdentifier {
  contextId: string;
  imodelId: string;
}

/**
 * Example Ui Configuration for an iModel.js App
 */
export class AppUi {
  // Initialize the ConfigurableUiManager
  public static initialize() {
    ConfigurableUiManager.initialize();
  }
  public static currentOpenedIModel: number = 0;
  public static IsNeedUpdate(index: number) {
    return index !== AppUi.currentOpenedIModel;
  }
  public static QueryiModelIdentifeier(index: number) {
    if (index < 0 || index >= AppUi.iModelIdentifierList.length) {
      alert("iModel 标识符不合法!");
      return undefined;
    }
    AppUi.currentOpenedIModel = index;
    return AppUi.iModelIdentifierList[index];
  }
  public static iModelIdentifierList: iModelIdentifier[] = [];
  public static async InitIModelIdentifier() {
    const contextId = "9374a302-8743-403e-ad03-6c49ef13c15e";
    const requestContext = await AuthorizedFrontendRequestContext.create();
    const imodels = await IModelApp.iModelClient.iModels.get(
      requestContext,
      contextId
    );
    for (const imodel of imodels) {
      if (imodel.id) {
        AppUi.iModelIdentifierList.push({
          contextId: contextId,
          imodelId: imodel.id,
        });
      }
    }
  }


  // Command that toggles the backstage
  public static get backstageToggleCommand(): CommandItemDef {
    return BackstageManager.getBackstageToggleCommand();
  }
  /** Pick the first two available spatial, orthographic or drawing view definitions in the imodel */
  public static async getFirstTwoViewDefinitions(
    imodel: IModelConnection
  ): Promise<ViewState[]> {
    const viewSpecs = await imodel.views.queryProps({});
    const acceptedViewClasses = [
      "BisCore:SpatialViewDefinition",
      "BisCore:DrawingViewDefinition",
      "BisCore:OrthographicViewDefinition",
    ];
    const acceptedViewSpecs = viewSpecs.filter(
      (spec) => -1 !== acceptedViewClasses.indexOf(spec.classFullName)
    );
    if (1 > acceptedViewSpecs.length)
      throw new Error("No valid view definitions in imodel");

    const viewStates: ViewState[] = [];
    for (const viewDef of acceptedViewSpecs) {
      const viewState = await imodel.views.load(viewDef.id!);
      viewStates.push(viewState);
    }

    if (1 === acceptedViewSpecs.length) {
      const viewState = await imodel.views.load(acceptedViewSpecs[0].id!);
      viewStates.push(viewState);
    }

    return viewStates;
  }
}

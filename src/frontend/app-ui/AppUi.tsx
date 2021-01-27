/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config, OpenMode } from "@bentley/bentleyjs-core";
import {
  BriefcaseConnection,
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
    AppUi.InitIModelIdentifier();
  }
  public static iModelIdentifierList: iModelIdentifier[] = [];
  public static InitIModelIdentifier() {
    const contextId1 = Config.App.get("imjs_contextId_1");
    const imodelId1 = Config.App.get("imjs_imodelId_1");
    AppUi.iModelIdentifierList.push({
      contextId: contextId1,
      imodelId: imodelId1,
    });

    const contextId2 = Config.App.get("imjs_contextId_2");
    const imodelId2 = Config.App.get("imjs_imodelId_2");
    AppUi.iModelIdentifierList.push({
      contextId: contextId2,
      imodelId: imodelId2,
    });

    const contextId0 = Config.App.get("imjs_contextId_0");
    const imodelId0 = Config.App.get("imjs_imodelId_0");
    AppUi.iModelIdentifierList.push({
      contextId: contextId0,
      imodelId: imodelId0,
    });
  }

  public static async CreateIModelConnection(index: number) {
    if (index >= AppUi.iModelIdentifierList.length || index < 0) {
      alert("将要打开的imodel索引不合法!");
      return;
    }
    const currentIModelConnection = UiFramework.getIModelConnection();
    if (currentIModelConnection) {
      SyncUiEventDispatcher.clearConnectionEvents(currentIModelConnection);
      currentIModelConnection.selectionSet.onChanged.clear();
      await currentIModelConnection.close();
    }
    // attempt to open the imodel
    const imodelIdentifier = AppUi.iModelIdentifierList[index];
    const imodel = await RemoteBriefcaseConnection.open(
      imodelIdentifier.contextId,
      imodelIdentifier.imodelId,
      OpenMode.Readonly
    );
    imodel.selectionSet.onChanged.addListener(ClearSelectedDevice);
    UiFramework.setIModelConnection(imodel, true);
  }
  // Command that toggles the backstage
  public static get backstageToggleCommand(): CommandItemDef {
    return BackstageManager.getBackstageToggleCommand();
  }

  /** Handle when an iModel and the views have been selected  */
  public static handleIModelViewsSelected(
    iModelConnection: IModelConnection,
    viewStates: ViewState[]
  ): void {
    // Set the iModelConnection in the Redux store
    UiFramework.setIModelConnection(iModelConnection);
    UiFramework.setDefaultViewState(viewStates[0]);

    // Tell the SyncUiEventDispatcher about the iModelConnection
    SyncUiEventDispatcher.initializeConnectionEvents(iModelConnection);

    // We create a FrontStage that contains the views that we want.
    const frontstageProvider = new SampleFrontstage(viewStates);
    FrontstageManager.addFrontstageProvider(frontstageProvider);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    FrontstageManager.setActiveFrontstageDef(
      frontstageProvider.frontstageDef
    ).then(() => {
      // Frontstage is ready
      TestDeSerializationView();
    });
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

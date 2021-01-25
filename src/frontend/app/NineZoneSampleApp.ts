/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ClientRequestContext, Config, Guid } from "@bentley/bentleyjs-core";
import { FrontendAuthorizationClient } from "@bentley/frontend-authorization-client";
import { IModelBankClient } from "@bentley/imodelhub-client";
import { IModelBankBasicAuthorizationClient } from "@bentley/imodelhub-client/lib/imodelbank/IModelBankBasicAuthorizationClient";
import { BentleyCloudRpcManager } from "@bentley/imodeljs-common";
import {
  IModelApp,
  IModelAppOptions,
  QuantityFormatter,
  ViewGlobeBirdTool,
} from "@bentley/imodeljs-frontend";
import { Presentation } from "@bentley/presentation-frontend";
import { AppNotificationManager, UiFramework } from "@bentley/ui-framework";
import { getSupportedRpcs } from "../../common/rpcs";
import { SelectElement } from "../app-ui/widgets/DeviceTree";
import { WalkRoundTool } from "../feature/WalkRound";
import { AppState, AppStore } from "./AppState";
import { ITwinWebAccuSnap } from "./ITwinWebAccuSnap";

/**
 * List of possible backends that ninezone-sample-app can use
 */
export enum UseBackend {
  /** Use local ninezone-sample-app backend */
  Local = 0,

  /** Use deployed general-purpose backend */
  GeneralPurpose = 1,
}

// subclass of IModelApp needed to use imodeljs-frontend
export class NineZoneSampleApp {
  private static _appState: AppState;

  public static get oidcClient(): FrontendAuthorizationClient {
    return IModelApp.authorizationClient as FrontendAuthorizationClient;
  }

  public static get store(): AppStore {
    return this._appState.store;
  }

  public static async startup(): Promise<void> {
    const opts: IModelAppOptions = {};
    opts.notifications = new AppNotificationManager();
    opts.applicationVersion = "1.0.0";
    const url = Config.App.get("imjs_imodelbank_url");
    const imodelClient = new IModelBankClient(url, undefined);
    opts.imodelClient = imodelClient;
    // iTwinStack: Setup IModelBankBasicAuthorizationClient from username and password in config
    const email = Config.App.get("imjs_imodelbank_user");
    const password = Config.App.get("imjs_imodelbank_password");
    opts.authorizationClient = new IModelBankBasicAuthorizationClient(
      { id: Guid.createValue() },
      { email, password }
    );
    //此处QuantityFormatter类是imodel系统类，实际可能以用户自定义子类去实例化。
    const quantityFormatter = new QuantityFormatter();
    opts.quantityFormatter = quantityFormatter;
    const accuSnap = new ITwinWebAccuSnap();
    opts.accuSnap = accuSnap;
    await IModelApp.startup(opts);
    await IModelApp.authorizationClient?.signIn(new ClientRequestContext());
    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize RPC communication
    initPromises.push(NineZoneSampleApp.initializeRpc());

    // initialize localization for the app
    initPromises.push(
      IModelApp.i18n.registerNamespace("NineZoneSample").readFinished
    );

    // create the application state store for Redux
    this._appState = new AppState();

    // initialize UiFramework
    initPromises.push(UiFramework.initialize(this.store, IModelApp.i18n));
    IModelApp.quantityFormatter.useImperialFormats = false;
    initPromises.push(NineZoneSampleApp.registerTool());
    // initialize Presentation
    initPromises.push(
      Presentation.initialize({
        activeLocale: IModelApp.i18n.languageList()[0],
      })
    );

    // the app is ready when all initialization promises are fulfilled
    await Promise.all(initPromises);
    (IModelApp.accuSnap as ITwinWebAccuSnap).onDataButtonDown.addListener(
      SelectElement
    );
  }
  private static async registerTool() {
    await IModelApp.i18n.registerNamespace("NineZoneSample").readFinished;
    ViewGlobeBirdTool.register(IModelApp.i18n.getNamespace("NineZoneSample"));
    WalkRoundTool.register(IModelApp.i18n.getNamespace("NineZoneSample"));
  }
  private static async initializeRpc(): Promise<void> {
    const rpcInterfaces = getSupportedRpcs();
    const backendURL = Config.App.get("imjs_backend_url");
    const rpcParams = {
      info: { title: "ninezone-sample-app", version: "v1.0" },
      uriPrefix: backendURL,
    };
    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }
}

/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config, OpenMode } from "@bentley/bentleyjs-core";
// make sure webfont brings in the icons and css files.
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { ElectronRpcConfiguration } from "@bentley/imodeljs-common";
import {
  FrontendRequestContext,
  IModelApp,
  IModelConnection,
  RemoteBriefcaseConnection,
  ViewState,
} from "@bentley/imodeljs-frontend";
import { SignIn } from "@bentley/ui-components";
import { ConfigurableUiContent, UiFramework } from "@bentley/ui-framework";
import * as React from "react";
import { Provider } from "react-redux";
import { AppUi } from "../app-ui/AppUi";
import { AppBackstageComposer } from "../app-ui/backstage/AppBackstageComposer";
import { NineZoneSampleApp } from "../app/NineZoneSampleApp";
import "./App.css";

/** React state of the App component */
export interface AppState {
  user: {
    isAuthorized: boolean;
    isLoading?: boolean;
  };
  offlineIModel: boolean;
  imodel?: IModelConnection;
  viewStates?: ViewState[];
}

/** A component the renders the whole application UI */
export default class App extends React.Component<{}, AppState> {
  /** Creates an App instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      user: {
        isAuthorized: NineZoneSampleApp.oidcClient.isAuthorized,
        isLoading: false,
      },
      offlineIModel: false,
      imodel: undefined,
      viewStates: undefined,
    };
  }

  public componentDidMount() {
    NineZoneSampleApp.oidcClient.onUserStateChanged.addListener(
      this._onUserStateChanged
    );
    (async () => {
      this.testOpen();
    })();
  }
  private async testOpen() {
    let imodel: IModelConnection | undefined;
    try {
      {
        // attempt to open the imodel
        const contextId = "9374a302-8743-403e-ad03-6c49ef13c15e";
        const imodelId = "d477f96a-b21f-4e7b-9865-d6df63bb9e3b";

        // const imjs_test_context_id = "a3e76ac4-5222-4274-97f8-8fb7b60602f5";
        // const imjs_test_imodel_id = "16af800a-a81f-4a72-82cc-011b7875a3b1";
        imodel = await RemoteBriefcaseConnection.open(
          contextId,
          imodelId,
          // imjs_test_context_id,
          // imjs_test_imodel_id,
          OpenMode.ReadWrite
        );
        this._onIModelSelected(imodel);
      }
    } catch (e) {
      alert(e.message);
    }
  }
  public componentWillUnmount() {
    // unsubscribe from unified selection changes
    NineZoneSampleApp.oidcClient.onUserStateChanged.removeListener(
      this._onUserStateChanged
    );
  }

  private _onUserStateChanged = () => {
    this.setState((prev) => ({
      user: {
        ...prev.user,
        isAuthorized: NineZoneSampleApp.oidcClient.isAuthorized,
        isLoading: false,
      },
    }));
  };

  private _onRegister = () => {
    window.open("https://git.io/fx8YP", "_blank");
  };

  private _onOffline = () => {
    this.setState((prev) => ({
      user: { ...prev.user, isLoading: false },
      offlineIModel: true,
    }));
  };

  private _onStartSignin = async () => {
    this.setState((prev) => ({ user: { ...prev.user, isLoading: true } }));
    await NineZoneSampleApp.oidcClient.signIn(new FrontendRequestContext());
  };

  /** Pick the first two available spatial, orthographic or drawing view definitions in the imodel */
  private async getFirstTwoViewDefinitions(
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

  /** Handle iModel open event */
  private _onIModelSelected = async (imodel: IModelConnection | undefined) => {
    if (!imodel) {
      // reset the state when imodel is closed
      this.setState({ imodel: undefined, viewStates: undefined });
      UiFramework.setIModelConnection(undefined);
      return;
    }
    try {
      // attempt to get ViewState for the first two available view definitions
      const viewStates = await this.getFirstTwoViewDefinitions(imodel);
      if (viewStates) {
        this.setState({ imodel, viewStates }, () => {
          AppUi.handleIModelViewsSelected(imodel, viewStates);
        });
      }
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      this.setState({ imodel: undefined, viewStates: undefined });
      alert(e.message);
    }
  };

  private get _signInRedirectUri() {
    const split = (Config.App.get(
      "imjs_browser_test_redirect_uri"
    ) as string).split("://");
    return split[split.length - 1];
  }

  private delayedInitialization() {
    if (this.state.offlineIModel) {
      // WORKAROUND: Clear authorization client if operating in offline mode
      IModelApp.authorizationClient = undefined;
    }
  }

  /** The component's render method */
  public render() {
    let ui: React.ReactNode;
    let style: React.CSSProperties = {};

    if (
      this.state.user.isLoading ||
      window.location.href.includes(this._signInRedirectUri)
    ) {
      // if user is currently being loaded, just tell that
      ui = `${IModelApp.i18n.translate("NineZoneSample:signing-in")}...`;
    } else if (!this.state.user.isAuthorized && !this.state.offlineIModel) {
      // if user doesn't have an access token, show sign in page
      // Only call with onOffline prop for electron mode since this is not a valid option for Web apps
      if (ElectronRpcConfiguration.isElectron)
        ui = (
          <SignIn
            onSignIn={this._onStartSignin}
            onRegister={this._onRegister}
            onOffline={this._onOffline}
          />
        );
      else
        ui = (
          <SignIn
            onSignIn={this._onStartSignin}
            onRegister={this._onRegister}
          />
        );
    } else if (!this.state.imodel || !this.state.viewStates) {
      // NOTE: We needed to delay some initialization until now so we know if we are opening a snapshot or an imodel.
      this.delayedInitialization();
      // if we don't have an imodel / view definition id - render a button that initiates imodel open
      ui = <div>正在打开模型.....</div>;
    } else {
      // if we do have an imodel and view definition id - render imodel components
      ui = <IModelComponents />;
      style = { display: "none" };
    }

    // render the app
    return (
      <Provider store={NineZoneSampleApp.store}>
        <div className="App">
          <div className="Header" style={style}>
            <h2>
              {IModelApp.i18n.translate("NineZoneSample:welcome-message")}
            </h2>
          </div>
          {ui}
        </div>
      </Provider>
    );
  }
}

/** Renders a viewport, a tree, a property grid and a table */
class IModelComponents extends React.PureComponent {
  public render() {
    return <ConfigurableUiContent appBackstage={<AppBackstageComposer />} />;
  }
}

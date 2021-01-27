/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// make sure webfont brings in the icons and css files.
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import {
  IModelApp,
  IModelConnection,
  ViewState,
} from "@bentley/imodeljs-frontend";
import { ConfigurableUiContent, UiFramework } from "@bentley/ui-framework";
import * as React from "react";
import { connect } from "react-redux";
import { AppUi } from "../app-ui/AppUi";
import { AppBackstageComposer } from "../app-ui/backstage/AppBackstageComposer";
import { RootState } from "../app/AppState";
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
interface AppProp {
  imodel: IModelConnection;
}
/** A component the renders the whole application UI */
export default class App extends React.Component<AppProp, AppState> {
  /** Creates an App instance */
  constructor(props: AppProp) {
    super(props);
    this.state = {
      user: {
        isAuthorized: NineZoneSampleApp.oidcClient.isAuthorized,
        isLoading: false,
      },
      offlineIModel: false,
      imodel: props.imodel,
      viewStates: undefined,
    };
  }

  public componentDidMount() {
    this._onIModelSelected(this.props.imodel);
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
      const viewStates = await AppUi.getFirstTwoViewDefinitions(imodel);
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

    if (!this.state.imodel || !this.state.viewStates) {
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
      <div className="App">
        <div className="Header" style={style}>
          <h2>{IModelApp.i18n.translate("NineZoneSample:welcome-message")}</h2>
        </div>
        {ui}
      </div>
    );
  }
}

/** Renders a viewport, a tree, a property grid and a table */
class IModelComponents extends React.PureComponent {
  public render() {
    return <ConfigurableUiContent appBackstage={<AppBackstageComposer />} />;
  }
}

function mapStateToProps(state: RootState) {
  const frameworkState = state.frameworkState;
  if (!frameworkState) return undefined;
  return { imodel: frameworkState.sessionState.iModelConnection! };
}
export const AppComposer = connect(mapStateToProps)(App); // eslint-disable-line @typescript-eslint/naming-convention

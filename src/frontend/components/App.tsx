/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// make sure webfont brings in the icons and css files.
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import * as React from "react";
import { Provider } from "react-redux";

import {
  IModelApp,
  IModelConnection,
  MessageBoxIconType,
  MessageBoxType,
  RemoteBriefcaseConnection,
} from "@bentley/imodeljs-frontend";
import { Dialog, LoadingSpinner, SpinnerSize } from "@bentley/ui-core";
import {
  ConfigurableUiContent,
  FrontstageManager,
  SessionStateActionId,
  SyncUiEventDispatcher,
  SyncUiEventId,
  ThemeManager,
  ToolbarDragInteractionContext,
  UiFramework,
} from "@bentley/ui-framework";
import "./App.css";
import { NineZoneSampleApp } from "../app/NineZoneSampleApp";
import { SampleFrontstage } from "../app-ui/frontstages/SampleFrontstage";
import { AppUi } from "../app-ui/AppUi";
import { AppBackstageComposer } from "../app-ui/backstage/AppBackstageComposer";
import { SwitchState } from "../app/AppState";
import { OpenMode } from "@bentley/bentleyjs-core";
import {
  CustomSelectEvent,
  TestDeSerializationView,
} from "../app-ui/frontstages/Feature";

/** React state of the App component */
export interface AppState {
  user: {
    isLoading?: boolean;
  };
  isOpening: boolean; // is opening a snapshot/iModel
}

/** A component that renders the whole application UI */
export default class AppComponent extends React.Component<{}, AppState> {
  private _wantSnapshot: boolean;

  /** Creates an App instance */
  constructor(props: {}) {
    super(props);

    this.state = {
      user: {
        isLoading: false,
      },
      isOpening: false,
    };

    this._wantSnapshot = true;

    this.addSwitchStateSubscription();
    const Identifier = AppUi.QueryiModelIdentifeier(1);
    if (Identifier) {
      this._contextId = Identifier.contextId;
      this._imodelId = Identifier.imodelId;
    }
  }

  private addSwitchStateSubscription() {
    this._subscription = NineZoneSampleApp.store.subscribe(async () => {
      const switchState = NineZoneSampleApp.store.getState().switchIModelState
        .switchState;
      if (switchState === SwitchState.OpenIModel) {
        const selectedIModel = NineZoneSampleApp.store.getState()
          .switchIModelState.selectedIModel;
        if (selectedIModel) {
          this._contextId = selectedIModel.projectName;
          this._imodelId = selectedIModel.imodelName;
          await this._handleOpen();
        }
      }
    });
  }
  private _contextId: string | undefined = undefined;
  private _imodelId: string | undefined = undefined;

  public componentDidMount() {
    this._handleOpen();
  }
  public componentWillUnmount() {
    this._subscription.unsubscribe();
  }
  private _subscription: any;
  /** Handle iModel open event */
  private _onIModelOpened = async (imodel: IModelConnection | undefined) => {
    this.setState({ isOpening: false });
    if (!imodel) {
      UiFramework.setIModelConnection(undefined,true);
      return;
    }
    try {
      // attempt to get ViewState for the first available view definition
      const viewState = await AppUi.getFirstTwoViewDefinitions(imodel);
      if (viewState) {
        // Set the iModelConnection in the Redux store
        imodel.selectionSet.onChanged.addListener(CustomSelectEvent);
        UiFramework.setIModelConnection(imodel,true);
        UiFramework.setDefaultViewState(viewState[0]);

        // We create a FrontStage that contains the view that we want.
        SyncUiEventDispatcher.dispatchImmediateSyncUiEvent(
          SessionStateActionId.SetIModelConnection
        );
        const frontstageProvider = new SampleFrontstage(viewState);
        // const frontstageProvider: FrontstageProvider = new MainFrontstage() as FrontstageProvider;
        FrontstageManager.addFrontstageProvider(frontstageProvider);

        // Tell the SyncUiEventDispatcher about the iModelConnection
        SyncUiEventDispatcher.initializeConnectionEvents(imodel);

        FrontstageManager.setActiveFrontstageDef(
          frontstageProvider.frontstageDef
        ).then(() => {
          // Frontstage is ready
          TestDeSerializationView();
        });
      } else {
        // If we failed to find a viewState, then we will just close the imodel and allow the user to select a different shapshot/iModel
        await AppComponent.closeCurrentIModel();
        this.doReselectOnError();
      }
    } catch (e) {
      // if failed, close the imodel and reset the state
      await AppComponent.closeCurrentIModel();
      alert(e.message);
      this.doReselectOnError();
    }
  };

  private doReselectOnError() {}

  private _renderSpinner(msg: string) {
    return (
      <Dialog opened={true} modal={true} hideHeader={true} width={300}>
        <span style={{ margin: "10px" }}>
          <LoadingSpinner size={SpinnerSize.Large} message={msg} />
        </span>
      </Dialog>
    );
  }

  /** The component's render method */
  public render() {
    let ui: React.ReactNode = <IModelComponents />;
    // render the app
    return (
      <Provider store={NineZoneSampleApp.store}>
        <div className="AppComponent">
          {ui}
          {this.state.isOpening && this._renderSpinner("正在打开iModel...")}
        </div>
      </Provider>
    );
  }

  public static async closeCurrentIModel() {
    const currentIModelConnection = UiFramework.getIModelConnection();
    if (currentIModelConnection) {
      SyncUiEventDispatcher.clearConnectionEvents(currentIModelConnection);
      if (currentIModelConnection.isSnapshot)
        await currentIModelConnection.close();
      UiFramework.setIModelConnection(undefined,true);
    }
  }

  private _handleOpen = async () => {
    this.setState({ isOpening: true });

    // close previous iModel/snapshot (if open)
    await AppComponent.closeCurrentIModel();

    if (this._wantSnapshot) return this._handleOpenSnapshot();
  };

  private _handleOpenSnapshot = async () => {
    if (!this._contextId || !this._imodelId) {
      return;
    }
    let imodel: IModelConnection | undefined;
    try {
      // attempt to open the imodel
      imodel = await RemoteBriefcaseConnection.open(
        this._contextId,
        this._imodelId,
        OpenMode.Readonly
      );
    } catch (e) {
      this.setState({ isOpening: false });
      await IModelApp.notifications.openMessageBox(
        MessageBoxType.Ok,
        "iModel打开失败",
        MessageBoxIconType.Critical
      );
      this.doReselectOnError();
      return;
    }

    await this._onIModelOpened(imodel);
  };
}
/** Renders a viewport and a property grid */
class IModelComponents extends React.PureComponent {
  public render() {
    return (
      <Provider store={NineZoneSampleApp.store}>
        <ThemeManager>
          <ToolbarDragInteractionContext.Provider value={false}>
            <ConfigurableUiContent appBackstage={<AppBackstageComposer />} />
          </ToolbarDragInteractionContext.Provider>
        </ThemeManager>
      </Provider>
    );
  }
}

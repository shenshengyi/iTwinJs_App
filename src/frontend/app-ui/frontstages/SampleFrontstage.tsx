/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ViewState } from "@bentley/imodeljs-frontend";
import { StatusBarSection } from "@bentley/ui-abstract";
import {
  BasicNavigationWidget,
  CommandItemDef,
  ConfigurableUiManager,
  ContentGroup,
  ContentLayoutDef,
  ContentLayoutManager,
  ContentViewManager,
  CoreTools,
  CustomItemDef,
  Frontstage,
  FrontstageProvider,
  GroupItemDef,
  IModelConnectedViewSelector,
  IModelViewportControl,
  ItemList,
  ReviewToolWidget,
  SelectionInfoField,
  SessionStateActionId,
  SnapModeField,
  StagePanel,
  StatusBarComposer,
  StatusBarItem,
  StatusBarItemUtilities,
  StatusBarWidgetControl,
  StatusBarWidgetControlArgs,
  SyncUiEventId,
  ToolbarHelper,
  UiFramework,
  ViewAttributesStatusField,
  ViewSelector,
  Widget,
  WidgetState,
  withStatusFieldProps,
  Zone,
  ZoneLocation,
  ZoneState,
} from "@bentley/ui-framework";
import * as React from "react";
import { AppStatusBarWidget } from "../statusbars/AppStatusBar";
import { PropertyGridWidget } from "../widgets/PropertyGridWidget";
import { RenderModeInfoField } from "../widgets/TableWidget";
import {
  DeviceWidget,
  DeviceWidgetTest,
  TreeWidget,
  TreeWidget2021,
  TestWidget20212021,
} from "../widgets/TreeWidget";
import { MyViewSelector } from "../widgets/ViewSelector";
import { TestFeature } from "./Feature";
export enum StagePanelState {
  Off,
  Minimized,
  Open,
  Popup,
}
/* eslint-disable react/jsx-key */

/**
 * Sample Frontstage for 9-Zone sample application
 */
export class SampleFrontstage extends FrontstageProvider {
  // Content layout for content views
  // TWo content layouts for content views
  private _contentLayoutDef1: ContentLayoutDef;
  private _contentLayoutDef2: ContentLayoutDef;
  // Content group for both layouts
  private _contentGroup: ContentGroup;

  constructor(public viewStates: ViewState[]) {
    super();
    // Create the content layouts.
    this._contentLayoutDef1 = new ContentLayoutDef({
      id: "SingleContent",
    });

    this._contentLayoutDef2 = new ContentLayoutDef({
      verticalSplit: { percentage: 0.5, left: 0, right: 1 },
    });
    // Create the content group.
    this._contentGroup = new ContentGroup({
      contents: [
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: UiFramework.getDefaultViewState,
            iModelConnection: UiFramework.getIModelConnection,
            disableDefaultViewOverlay: true,
          },
        },
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: UiFramework.getDefaultViewState,
            iModelConnection: UiFramework.getIModelConnection,
            disableDefaultViewOverlay: true,
          },
        },
      ],
    });
  }
  private _rightPanel = {
    allowedZones: [2, 6, 9],
  };
  /** Define the Frontstage properties */
  public get frontstage() {
    return (
      <Frontstage
        id="SampleFrontstage"
        defaultTool={CoreTools.selectElementCommand}
        toolSettings={<Zone widgets={[<Widget isToolSettings={true} />]} />}
        defaultLayout={this._contentLayoutDef1}
        contentGroup={this._contentGroup}
        isInFooterMode={true}
        topLeft={
          <Zone
            widgets={[
              <Widget
                isFreeform={true}
                element={
                  <SampleToolWidget
                    switchLayout1={this._switchLayout1}
                    switchLayout2={this._switchLayout2}
                  />
                }
              />,
            ]}
          />
        }
        // rightPanel={
        //   <StagePanel
        //     defaultState={StagePanelState.Open}
        //     resizable={true}
        //     applicationData={{ key: "value" }}
        //     widgets={[<Widget element={<h3>Right panel</h3>} />]}
        //   />
        // }
        rightPanel={
          <StagePanel
            resizable={false}
            pinned={false}
            allowedZones={[ZoneLocation.TopLeft]}
            widgets={[
              <Widget
                control={TestWidget20212021}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="NineZoneSample:components.tree"
                preferredPanelSize="fit-content"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
            ]}
          />
        }
        leftPanel={
          <StagePanel
            widgets={[
              <Widget
                control={TestWidget20212021}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="NineZoneSample:components.tree"
                preferredPanelSize="fit-content"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
            ]}
          />
        }
        bottomPanel={
          <StagePanel
            widgets={[
              <Widget
                control={TestWidget20212021}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="NineZoneSample:components.tree"
                preferredPanelSize="fit-content"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
            ]}
          />
        }
        topCenter={<Zone widgets={[<Widget isToolSettings={true} />]} />}
        topRight={
          <Zone
            widgets={[
              /** Use standard NavigationWidget delivered in ui-framework */
              <Widget
                isFreeform={true}
                element={
                  <BasicNavigationWidget
                    additionalVerticalItems={ToolbarHelper.createToolbarItemsFromItemDefs(
                      [this._viewSelectorItemDef],
                      30
                    )}
                  />
                }
              />,
            ]}
          />
        }
        centerRight={
          <Zone
            defaultState={ZoneState.Minimized}
            allowsMerging={true}
            widgets={[
              <Widget
                control={TreeWidget2021}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="图层树"
                tooltipKey="图层树"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
              <Widget
                control={TreeWidget}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="模型树"
                tooltipKey="图层树"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
            ]}
          />
        }
        centerLeft={
          <Zone
            defaultState={ZoneState.Open}
            allowsMerging={true}
            widgets={[
              <Widget
                control={DeviceWidget}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="NineZoneSample:components.tree"
                preferredPanelSize="fit-content"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
              <Widget
                control={DeviceWidgetTest}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="测试表格"
                preferredPanelSize="fit-content"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
                // syncEventIds={[SyncUiEventId.SelectionSetChanged]}
                // stateFunc={this._determineWidgetStateForSelectionSet}
              />,
            ]}
          />
        }
        bottomCenter={
          <Zone
            widgets={[
              <Widget isStatusBar={true} control={AppStatusBarWidget} />,
            ]}
          />
        }
        bottomRight={
          <Zone
            defaultState={ZoneState.Open}
            allowsMerging={true}
            widgets={[
              <Widget
                id="Properties"
                control={PropertyGridWidget}
                defaultState={WidgetState.Closed}
                fillZone={true}
                iconSpec="icon-properties-list"
                labelKey="NineZoneSample:components.properties"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
                syncEventIds={[SyncUiEventId.SelectionSetChanged]}
                stateFunc={this._determineWidgetStateForSelectionSet}
              />,
            ]}
          />
        }
        statusBar={
          <Zone
            widgets={[
              <Widget
                isStatusBar={true}
                control={SmallStatusBarWidgetControl1}
              />,
            ]}
          />
        }
      />
    );
  }
  /** Command that switches to layout 1 */
  private get _switchLayout1(): CommandItemDef {
    return new CommandItemDef({
      iconSpec: "icon-placeholder",
      labelKey: "一个视口",
      execute: async () => {
        await ContentLayoutManager.setActiveLayout(
          this._contentLayoutDef1,
          this._contentGroup
        );
      },
    });
  }

  /** Command that switches to layout 2 */
  private get _switchLayout2(): CommandItemDef {
    return new CommandItemDef({
      iconSpec: "icon-placeholder",
      labelKey: "两个视窗",
      execute: async () => {
        await ContentLayoutManager.setActiveLayout(
          this._contentLayoutDef2,
          this._contentGroup
        );
      },
    });
  }
  /** Determine the WidgetState based on the Selection Set */
  private _determineWidgetStateForSelectionSet = (): WidgetState => {
    const activeContentControl = ContentViewManager.getActiveContentControl();
    if (
      activeContentControl &&
      activeContentControl.viewport &&
      activeContentControl.viewport.view.iModel.selectionSet.size > 0
    )
      return WidgetState.Open;
    return WidgetState.Closed;
  };

  /** Get the CustomItemDef for ViewSelector  */
  private get _viewSelectorItemDef() {
    return new CustomItemDef({
      customId: "sampleApp:viewSelector",
      reactElement: (
        <MyViewSelector
          listenForShowUpdates={true}
          imodel={UiFramework.getIModelConnection()!}
        />
      ),
      // stateSyncIds: [SessionStateActionId.SetIModelConnection],
    });
  }
}
/* Properties for SampleToolWidget widget */
interface SampleToolWidgetProps {
  switchLayout1: CommandItemDef;
  switchLayout2: CommandItemDef;
}
/**
 * Define a ToolWidget with Buttons to display in the TopLeft zone.
 */
class SampleToolWidget extends React.Component<SampleToolWidgetProps> {
  public render(): React.ReactNode {
    // const verticalItems = new ItemList([
    //   new GroupItemDef({
    //     labelKey: "NineZoneSample:buttons.switchLayouts",
    //     iconSpec: "icon-placeholder",
    //     items: [this.props.switchLayout1, this.props.switchLayout2],
    //   }),
    // ]);
    const horizontalItems = new ItemList([...TestFeature.ItemLists]);
    horizontalItems.addItem(this.props.switchLayout1);
    horizontalItems.addItem(this.props.switchLayout2);
    return <ReviewToolWidget suffixVerticalItems={horizontalItems} />;
  }
}
export class SmallStatusBarWidgetControl1 extends StatusBarWidgetControl {
  private _statusBarItems: StatusBarItem[] | undefined;

  private get statusBarItems(): StatusBarItem[] {
    // tslint:disable-next-line: variable-name
    const SnapAttributes = withStatusFieldProps(SnapModeField);
    // tslint:disable-next-line: variable-name
    const ViewAttributes = withStatusFieldProps(ViewAttributesStatusField);
    // tslint:disable-next-line: variable-name
    const SelectionInfo = withStatusFieldProps(SelectionInfoField);
    const RenderModeInfo = withStatusFieldProps(RenderModeInfoField);
    // tslint:disable-next-line: variable-name
    if (!this._statusBarItems) {
      this._statusBarItems = [
        StatusBarItemUtilities.createStatusBarItem(
          "ViewAttributes",
          StatusBarSection.Center,
          60,
          <ViewAttributes />
        ),
        StatusBarItemUtilities.createStatusBarItem(
          "SnapAttributes",
          StatusBarSection.Left,
          10,
          <SnapAttributes />
        ),
        StatusBarItemUtilities.createStatusBarItem(
          "SelectionInfo",
          StatusBarSection.Right,
          20,
          <SelectionInfo />
        ),
        StatusBarItemUtilities.createStatusBarItem(
          "RenderModeInfo",
          StatusBarSection.Left,
          30,
          <RenderModeInfo />
        ),
      ];
    }
    return this._statusBarItems;
  }

  public getReactNode(_args: StatusBarWidgetControlArgs): React.ReactNode {
    return <StatusBarComposer items={this.statusBarItems} />;
  }
}
ConfigurableUiManager.registerControl(
  "SmallStatusBar1",
  SmallStatusBarWidgetControl1
);

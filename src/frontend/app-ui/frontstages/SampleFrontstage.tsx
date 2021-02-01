/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ViewState } from "@bentley/imodeljs-frontend";
import { StatusBarSection } from "@bentley/ui-abstract";
import {
  BasicNavigationWidget,
  ConfigurableUiManager,
  ContentGroup,
  ContentLayoutDef,
  ContentViewManager,
  CoreTools,
  CustomItemDef,
  Frontstage,
  FrontstageProvider,
  IModelConnectedViewSelector,
  IModelViewportControl,
  ItemList,
  ReviewToolWidget,
  SelectionInfoField,
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
  Widget,
  WidgetState,
  withStatusFieldProps,
  Zone,
  ZoneState,
} from "@bentley/ui-framework";
import * as React from "react";
import { AppStatusBarWidget } from "../statusbars/AppStatusBar";
import { PropertyGridWidget } from "../widgets/PropertyGridWidget";
import { RenderModeInfoField } from "../widgets/TableWidget";
import { DeviceWidget, TreeWidget } from "../widgets/TreeWidget";
import { TestFeature } from "./Feature";

/* eslint-disable react/jsx-key */

/**
 * Sample Frontstage for 9-Zone sample application
 */
export class SampleFrontstage extends FrontstageProvider {
  // Content layout for content views
  private _contentLayoutDef: ContentLayoutDef;

  // Content group for both layouts
  private _contentGroup: ContentGroup;

  constructor(public viewStates: ViewState[]) {
    super();

    // Create the content layouts.
    this._contentLayoutDef = new ContentLayoutDef({
      verticalSplit: {
        percentage: 0.5,
        left: 0,
        right: 1,
        minSizeLeft: 100,
        minSizeRight: 100,
      },
    });

    // Create the content group.
    this._contentGroup = new ContentGroup({
      contents: [
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: this.viewStates[0],
            iModelConnection: UiFramework.getIModelConnection(),
          },
        },
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: this.viewStates[1],
            iModelConnection: UiFramework.getIModelConnection(),
          },
        },
      ],
    });
  }

  /** Define the Frontstage properties */
  public get frontstage() {
    return (
      <Frontstage
        id="SampleFrontstage"
        defaultTool={CoreTools.selectElementCommand}
        toolSettings={<Zone widgets={[<Widget isToolSettings={true} />]} />}
        defaultLayout={this._contentLayoutDef}
        contentGroup={this._contentGroup}
        isInFooterMode={true}
        topLeft={
          <Zone
            widgets={[
              <Widget isFreeform={true} element={<SampleToolWidget />} />,
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
                control={TreeWidget}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="NineZoneSample:components.tree"
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
        rightPanel={<StagePanel allowedZones={[6, 9]} />}
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
        <IModelConnectedViewSelector
          listenForShowUpdates={false} // Demo for showing only the same type of view in ViewSelector - See IModelViewport.tsx, onActivated
        />
      ),
    });
  }
}

/**
 * Define a ToolWidget with Buttons to display in the TopLeft zone.
 */
class SampleToolWidget extends React.Component {
  public render(): React.ReactNode {
    const horizontalItems = new ItemList([...TestFeature.ItemLists]);
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

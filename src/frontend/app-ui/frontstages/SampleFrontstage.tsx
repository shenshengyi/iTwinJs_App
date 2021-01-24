/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ViewState } from "@bentley/imodeljs-frontend";
import { StatusBarSection } from "@bentley/ui-abstract";
import {
  BasicToolWidget,
  ConfigurableUiManager,
  ContentGroup,
  ContentLayoutDef,
  ContentViewManager,
  CoreTools,
  CustomItemDef,
  DefaultNavigationWidget,
  Frontstage,
  FrontstageProvider,
  IModelConnectedNavigationWidget,
  IModelConnectedViewSelector,
  IModelViewportControl,
  ItemList,
  SelectionInfoField,
  SnapModeField,
  StagePanel,
  StatusBarComposer,
  StatusBarItem,
  StatusBarItemUtilities,
  StatusBarWidgetControl,
  StatusBarWidgetControlArgs,
  SyncUiEventId,
  ToolWidget,
  UiFramework,
  ViewAttributesStatusField,
  Widget,
  WidgetState,
  withStatusFieldProps,
  Zone,
  ZoneState,
} from "@bentley/ui-framework";
import * as React from "react";
import { AppUi } from "../AppUi";
import { AppStatusBarWidget } from "../statusbars/AppStatusBar";
import { PropertyGridWidget } from "../widgets/PropertyGridWidget";
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
    this._contentLayoutDef = new ContentLayoutDef({});

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
        contentManipulationTools={
          <Zone
            widgets={[
              <Widget
                isFreeform={true}
                element={
                  <BasicToolWidget showCategoryAndModelsContextTools={true} />
                }
              />,
            ]}
          />
        }
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
                  <IModelConnectedNavigationWidget
                    suffixVerticalItems={
                      new ItemList([this._viewSelectorItemDef])
                    }
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
        viewNavigationTools={
          <Zone
            widgets={[
              <Widget
                isFreeform={true}
                element={
                  <DefaultNavigationWidget
                    suffixVerticalItems={TestFeature.ItemLists}
                  />
                }
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
    const horizontalItems = new ItemList([CoreTools.selectElementCommand]);

    return (
      <ToolWidget
        appButton={AppUi.backstageToggleCommand}
        horizontalItems={horizontalItems}
      />
    );
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
    // tslint:disable-next-line: variable-name
    if (!this._statusBarItems) {
      // const isHiddenCondition = new ConditionalBooleanValue(
      //   () => SampleAppIModelApp.getTestProperty() === "HIDE",
      //   [SampleAppUiActionId.setTestProperty]
      // );

      this._statusBarItems = [
        // StatusBarItemUtilities.createStatusBarItem(
        //   "ToolAssistance",
        //   StatusBarSection.Left,
        //   10,
        //   <ToolAssistance style={{ minWidth: "21em" }} />
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "ToolAssistanceSeparator",
        //   StatusBarSection.Left,
        //   15,
        //   <FooterMode>
        //     {" "}
        //     <FooterSeparator />{" "}
        //   </FooterMode>
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "MessageCenter",
        //   StatusBarSection.Left,
        //   20,
        //   <MessageCenter />
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "MessageCenterSeparator",
        //   StatusBarSection.Left,
        //   25,
        //   <FooterMode>
        //     {" "}
        //     <FooterSeparator />{" "}
        //   </FooterMode>
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "DisplayStyle",
        //   StatusBarSection.Center,
        //   40,
        //   <DisplayStyle />
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "ActivityCenter",
        //   StatusBarSection.Center,
        //   10,
        //   <ActivityCenter />
        // ),
        StatusBarItemUtilities.createStatusBarItem(
          "ViewAttributes",
          StatusBarSection.Center,
          60,
          <ViewAttributes />
        ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "Sections",
        //   StatusBarSection.Center,
        //   50,
        //   <Sections hideWhenUnused={true} />
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "ClearEmphasis",
        //   StatusBarSection.Center,
        //   40,
        //   <ClearEmphasis hideWhenUnused={true} />
        // ),
        // StatusBarItemUtilities.createStatusBarItem(
        //   "SnapMode",
        //   StatusBarSection.Center,
        //   30,
        //   <SnapMode />,
        //   { isHidden: false }
        // ),
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

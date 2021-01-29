/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { RenderMode } from "@bentley/imodeljs-common";
import { IModelApp } from "@bentley/imodeljs-frontend";
import {
  ConfigurableCreateInfo,
  StatusFieldProps,
  UiFramework,
  WidgetControl,
} from "@bentley/ui-framework";
import { FooterIndicator } from "@bentley/ui-ninezone";
import * as React from "react";
import { connect } from "react-redux";
import SimpleTableComponent from "../../components/Table";

/** A widget control for displaying the Table React component */
export class TableWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactNode = (
        <SimpleTableComponent imodel={options.iModelConnection} />
      );
    }
  }
}

interface RenderModeInfoFieldProps extends StatusFieldProps {
  selectionCount: number;
}
function mapStateToProps(state: any) {
  const frameworkState = state[UiFramework.frameworkStateKey]; // since app sets up key, don't hard-code name
  /* istanbul ignore next */
  if (!frameworkState) return undefined;

  return { selectionCount: frameworkState.sessionState.numItemsSelected };
}
class RenderModeInfoFieldComponent extends React.Component<RenderModeInfoFieldProps> {
  constructor(props: RenderModeInfoFieldProps) {
    super(props);
  }

  public render(): React.ReactNode {
    return (
      <FooterIndicator
        style={this.props.style}
        isInFooterMode={this.props.isInFooterMode}
      >
        <button onClick={Smooth}>Smooth</button>

        <button onClick={HiddenLine}>Hidden Line</button>

        <button onClick={SolidFill}>Solid Fill</button>

        <button onClick={Wireframe}>Wireframe</button>
      </FooterIndicator>
    );
  }
}
export const RenderModeInfoField = connect(mapStateToProps)(
  RenderModeInfoFieldComponent
);

function HandleRenderMode(mode: RenderMode) {
  const vp = IModelApp.viewManager.selectedView;
  if (!vp) {
    return;
  }
  let vf = vp.viewFlags.clone();
  vf.renderMode = mode;
  vp.viewFlags = vf;
}
async function Smooth() {
  HandleRenderMode(RenderMode.SmoothShade);
}
async function HiddenLine() {
  HandleRenderMode(RenderMode.HiddenLine);
}
async function SolidFill() {
  HandleRenderMode(RenderMode.SolidFill);
}
async function Wireframe() {
  HandleRenderMode(RenderMode.Wireframe);
}

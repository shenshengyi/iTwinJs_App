/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";

import { NineZoneSampleApp } from "./app/NineZoneSampleApp";
import { AppUi } from "./app-ui/AppUi";
import "./index.scss";
import AppComponent from "./components/App";
import { SwitchIModel } from "./app-ui/backstage/AppBackstageItemProvider";

(async () => {
  await NineZoneSampleApp.startup();
  await AppUi.InitIModelIdentifier();
  AppUi.initialize();
  ReactDOM.render(
    <div>
      <button onClick={jin}>酒泉</button>
      <button onClick={ta}>金塔</button>
      <AppComponent />
    </div>,
    document.getElementById("root") as HTMLElement
  );
})();

async function jin() {
  await SwitchIModel("酒泉合并");
}
async function ta() {
  await SwitchIModel("金塔合并");
}

/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Logger, LogLevel } from "@bentley/bentleyjs-core";

import { AppLoggerCategory } from "../common/LoggerCategory";
import { NineZoneSampleApp } from "./app/NineZoneSampleApp";
import { AppUi } from "./app-ui/AppUi";
import App, { AppComposer } from "./components/App";
import "./index.scss";
import { UiFramework } from "@bentley/ui-framework";
import { Provider } from "react-redux";

// Setup logging immediately to pick up any logging during NineZoneSampleApp.startup()
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning);
Logger.setLevel(AppLoggerCategory.Frontend, LogLevel.Info);

(async () => {
  // eslint-disable-line @typescript-eslint/no-floating-promises
  // Start the app.
  await NineZoneSampleApp.startup();

  // Initialize the AppUi & ConfigurableUiManager
  AppUi.initialize();
  await AppUi.CreateIModelConnection(0);
  // when initialization is complete, render
  ReactDOM.render(
    <Provider store={NineZoneSampleApp.store}>
      <AppComposer />
    </Provider>,
    document.getElementById("root") as HTMLElement
  );
})();

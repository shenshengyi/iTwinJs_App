/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BackstageItem, BackstageItemUtilities } from "@bentley/ui-abstract";
import { UiFramework } from "@bentley/ui-framework";
import { AppUi } from "../AppUi";

export class AppBackstageItemProvider {
  /** id of provider */
  public readonly id = "ninezone-sample-app.AppBackstageItemProvider";

  private _backstageItems: ReadonlyArray<BackstageItem> | undefined = undefined;

  public get backstageItems(): ReadonlyArray<BackstageItem> {
    if (!this._backstageItems) {
      this._backstageItems = [
        // BackstageItemUtilities.createStageLauncher(
        //   "SampleFrontstage",
        //   100,
        //   10,
        //   "金塔合并",
        //   undefined,
        //   "icon-placeholder"
        // ),
        BackstageItemUtilities.createActionItem(
          "金塔合并",
          100,
          10,
          async () => {
            await SwitchIModel("金塔合并");
          },
          "金塔合并",
          undefined,
          "icon-placeholder"
        ),
        BackstageItemUtilities.createActionItem(
          "酒泉合并",
          100,
          20,
          async () => {
            await SwitchIModel("酒泉合并");
          },
          "酒泉合并",
          undefined,
          "icon-placeholder"
        ),
        // BackstageItemUtilities.createActionItem(
        //   "测试数据",
        //   100,
        //   30,
        //   async () => {
        //     await SwitchIModel("测试数据");
        //   },
        //   "测试数据",
        //   undefined,
        //   "icon-placeholder"
        // ),
      ];
    }
    return this._backstageItems;
  }
}

async function SwitchIModel(frontstageId: string) {
  switch (frontstageId) {
    case "金塔合并": {
      await AppUi.CreateIModelConnection(0);
      break;
    }
    case "酒泉合并": {
      await AppUi.CreateIModelConnection(1);
      break;
    }
    case "测试数据": {
      await AppUi.CreateIModelConnection(2);
      break;
    }
  }
  const imodel = UiFramework.getIModelConnection();
  if (imodel) {
    const views = await AppUi.getFirstTwoViewDefinitions(imodel);
    AppUi.handleIModelViewsSelected(imodel, views);
  }
}

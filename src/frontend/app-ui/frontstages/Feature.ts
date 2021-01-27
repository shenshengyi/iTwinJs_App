import { Config } from "@bentley/bentleyjs-core";
import {
  IModelApp,
  ViewClipClearTool,
  ViewClipDecorationProvider,
  ViewGlobeBirdTool,
} from "@bentley/imodeljs-frontend";
import {
  CommandItemDef,
  ItemList,
  SavedView,
  SavedViewProps,
  UiFramework,
} from "@bentley/ui-framework";
import SVTRpcInterface from "../../../common/SVTRpcInterface";
import { TeskWalkRound } from "../../feature/WalkRound";

export class TestFeature {
  public static CreateCommand(
    id: string,
    des: string,
    func: (args?: any) => any
  ): CommandItemDef {
    const testV1Def = new CommandItemDef({
      commandId: id,
      execute: func,
      iconSpec: "icon-developer",
      label: des,
      description: des,
      tooltip: des,
    });
    return testV1Def;
  }
  public static ItemLists = new ItemList([
    TestFeature.CreateCommand("ClearClip", "清除剖析", ClearClip),
    TestFeature.CreateCommand(
      "TestDeSerializationView",
      "切换到保存视图",
      TestDeSerializationView
    ),
    TestFeature.CreateCommand(
      "TestSerializationView",
      "保存当前视图至外部文件",
      TestSerializationView
    ),
    TestFeature.CreateCommand(
      "ControlMapAndSky",
      "控制地面和天空",
      ControlMapAndSky
    ),
    TestFeature.CreateCommand(
      "ViewGlobeBirdToolRun",
      "鸟瞰",
      ViewGlobeBirdToolRun
    ),
    TestFeature.CreateCommand("TeskWalkRound", "漫游", TeskWalkRound),
    // TestFeature.CreateCommand("Test", "Test", Test),
  ]);
}

async function ClearClip() {
  const vp = IModelApp.viewManager.selectedView;
  if (vp) {
    IModelApp.tools.run(ViewClipClearTool.toolId);
    ViewClipDecorationProvider.create().toggleDecoration(vp);
  }
}
async function Test() {}
async function ViewGlobeBirdToolRun() {
  IModelApp.tools.run(ViewGlobeBirdTool.toolId);
}
async function ControlMapAndSky() {
  let vp = IModelApp.viewManager.selectedView!;
  let vf = vp.view.viewFlags.clone();
  vf.backgroundMap = !vf.backgroundMap;
  vf.shadows = !vf.shadows;
  vp.viewFlags = vf;
}
export async function TestSerializationView() {
  const savedViewFilePath = getSavedViewFilePath();
  if (!savedViewFilePath) {
    return;
  }
  const vp = IModelApp.viewManager.selectedView!.view;
  const viewProp = SavedView.viewStateToProps(vp);
  const strViewProp = JSON.stringify(viewProp);

  await SVTRpcInterface.getClient().writeExternalSavedViews(
    savedViewFilePath,
    strViewProp
  );
}
export async function TestDeSerializationView() {
  const savedViewFilePath = getSavedViewFilePath();
  if (!savedViewFilePath) {
    return;
  }
  const strViewProp = await SVTRpcInterface.getClient().readExternalSavedViews(
    savedViewFilePath
  );
  if (strViewProp === "") {
    return;
  }
  const vp = IModelApp.viewManager.selectedView!;
  const viewProp: SavedViewProps = JSON.parse(strViewProp);
  const imodel = UiFramework.getIModelConnection()!;
  const viewState = await SavedView.viewStateFromProps(imodel, viewProp);
  if (viewState) {
    vp.changeView(viewState);
  }
}

function getSavedViewFilePath() {
  const imodel = UiFramework.getIModelConnection();
  if (imodel) {
    const savedViewFilePath = Config.App.get("imjs_savedview_file");
    const path = savedViewFilePath + "/" + imodel.iModelId;
    return path;
  }
  return undefined;
}

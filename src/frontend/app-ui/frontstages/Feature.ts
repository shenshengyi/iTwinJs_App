import { Config, Guid } from "@bentley/bentleyjs-core";
import { RenderMode } from "@bentley/imodeljs-common";
import {
  EmphasizeElements,
  HitDetail,
  IModelApp,
  SelectionSetEvent,
  SelectionSetEventType,
  ViewClipClearTool,
  ViewClipDecorationProvider,
  ViewGlobeBirdTool,
} from "@bentley/imodeljs-frontend";
import {
  ContentFlags,
  ContentSpecificationTypes,
  DefaultContentDisplayTypes,
  DescriptorOverrides,
  KeySet,
  PresentationRpcInterface,
  Ruleset,
  RuleTypes,
} from "@bentley/presentation-common";
import {
  ISelectionProvider,
  Presentation,
  SelectionChangeEventArgs,
} from "@bentley/presentation-frontend";
import {
  CommandItemDef,
  ItemList,
  SavedView,
  SavedViewProps,
  UiFramework,
} from "@bentley/ui-framework";
import { PropertiesRpcInterface } from "../../../common/PropertiesRpcInterface";
import SVTRpcInterface from "../../../common/SVTRpcInterface";
import { TeskWalkRound } from "../../feature/WalkRound";
import { changeColor } from "../widgets/DeviceTree";
import { getContent } from "./PresentationQuery";
export async function testEvent(
  _args: SelectionChangeEventArgs,
  _provider: ISelectionProvider
) {
  // Presentation.selection.selectionChange.addListener
  // if (_args.source !== "Tool" || _args.imodel === undefined) {
  //   return;
  // }
  // const hiliteSet = await Presentation.selection.getHiliteSet(_args.imodel);
  // if (hiliteSet && hiliteSet.elements && hiliteSet.elements.length > 0) {
  //   const imodel = _args.imodel;
  //   const prop = imodel.getRpcProps();
  //   const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
  //     prop!,
  //     hiliteSet.elements[0]
  //   );
  //   const ids = await PropertiesRpcInterface.getClient().getDeviceAllChildElements(
  //     prop!,
  //     hiliteSet.elements[0]
  //   );
  //   const vp = IModelApp.viewManager.selectedView!;
  //   if (ids.length !== 0) {
  //     // changeColor(vp, ids);
  //   }
  //   if (parentId) {
  //     // alert(parentId);
  //   }
  // }
  // if (_args.source === "tool") {
  //   Presentation.selection.clearSelection(_args.source, _args.imodel);
  // }
  // console.log(args);
  // // console.log(provider);
  // const hiliteSet = await Presentation.selection.getHiliteSet(args.imodel);
  // console.log(hiliteSet);
  // const s = _provider.getSelection(args.imodel, 0);
  // console.log(s);
  // const vp = IModelApp.viewManager.selectedView!;
  // const ids = [...hiliteSet.elements!];
  // changeColor(vp, ids);
  // vp.zoomToElements(ids, { animateFrustumChange: true });
  // const vp = IModelApp.viewManager.selectedView!;
  // const imodel = _args.imodel;
  // if (!imodel) {
  //   return;
  // }
  // const emph = EmphasizeElements.getOrCreate(vp);
  // emph.wantEmphasis = true;
  // const om = emph.getOverriddenElements();
  // if (om?.values !== undefined) {
  //   om.forEach((_idSet, key) => {
  //     emph.clearOverriddenElements(vp, key);
  //   });
  // }
  // const hiltes = await Presentation.selection.getHiliteSet(imodel);
  // if (hiltes && hiltes.elements && hiltes.elements.length > 0) {
  //   const prop = imodel.getRpcProps();
  //   const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
  //     prop!,
  //     hiltes.elements[0]
  //   );
  //   if (parentId) {
  //     if (!imodel.selectionSet.has(parentId)) {
  //       imodel.selectionSet.add(parentId);
  //     }
  //     // Presentation.selection.clearSelection(_args.source, imodel);
  //     // const key = { className: "Element", id: parentId };
  //     // Presentation.selection.addToSelection("", imodel, new KeySet([key]));
  //   }
  // }
  // if (_currHit && _currHit.isElementHit && imodel) {
  //   const prop = imodel.getRpcProps();
  //   const ids = await PropertiesRpcInterface.getClient().getDeviceAllChildElements(
  //     prop!,
  //     _currHit.sourceId
  //   );
  //   if (ids.length !== 0) {
  //     changeColor(vp, ids);
  //   }
  //   const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
  //     prop!,
  //     _currHit.sourceId
  //   );
  //   if (parentId) {
  //     // imodel.hilited.clear();
  //     // imodel.selectionSet.emptyAll();
  //     if (imodel.selectionSet.isActive) {
  //       imodel.selectionSet.emptyAll();
  //       imodel.selectionSet.add(parentId);
  //     }
  //   }
  // }
}
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
    TestFeature.CreateCommand("Test", "Test", Test),
    TestFeature.CreateCommand(
      "TestCancleHide",
      "TestCancleHide",
      TestCancleHide
    ),
    TestFeature.CreateCommand("SetSmood", "SetSmood", SetSmood),
  ]);
}
async function SetSmood() {
  const vp = IModelApp.viewManager.selectedView!;
  vp.viewFlags.renderMode = RenderMode.SmoothShade;
}
async function TestCancleHide() {
  const vp = IModelApp.viewManager.selectedView!;
  vp.clearNeverDrawn();
}
const RULESET: Ruleset = {
  id: `properties`,
  rules: [
    {
      ruleType: RuleTypes.Content,
      specifications: [
        {
          specType: ContentSpecificationTypes.SelectedNodeInstances,
          acceptablePolymorphically: true,
          acceptableClassNames: ["Element"],
          acceptableSchemaName: "BisCore",
        },
      ],
    },
  ],
};
async function Hide(
  _args: SelectionChangeEventArgs,
  _provider: ISelectionProvider
) {
  if (_args.source !== "Tool" || _args.imodel === undefined) {
    return;
  }
  const hils = await Presentation.selection.getHiliteSet(_args.imodel);
  if (hils && hils.elements) {
    console.log(hils.elements);
    const vp = IModelApp.viewManager.selectedView!;
    ///////////////////////////////////////
    const emp = EmphasizeElements.getOrCreate(vp);
    emp.hideElements(hils.elements, vp, false);
    ///////////////////////////////////////
    // const s = new Set<string>();
    // if (vp.neverDrawn) {
    //   vp.neverDrawn.forEach((id) => {
    //     s.add(id);
    //   });
    // }

    // hils.elements.forEach((id) => {
    //   s.add(id);
    // });
    // vp.setNeverDrawn(s);
  }
}
async function Test() {
  // const imodel = UiFramework.getIModelConnection()!;
  // const prop = await imodel.getRpcProps();
  // const id = "0x5000000926b";
  // const result = await PropertiesRpcInterface.getClient().getElementAspects(
  //   prop!,
  //   id
  // );
  // console.log(result);

  Presentation.selection.selectionChange.addListener(Hide);
  // const ruleset: Ruleset = {
  //   id: Guid.createValue(),
  //   rules: [
  //     {
  //       ruleType: RuleTypes.Content,
  //       specifications: [
  //         {
  //           specType:
  //             ContentSpecificationTypes.ContentInstancesOfSpecificClasses,
  //           classes: { schemaName: "BisCore", classNames: ["Element"] },
  //           handleInstancesPolymorphically: true,
  //           // instanceFilter: `this.ECInstanceId = 1`,
  //         },
  //       ],
  //     },
  //   ],
  // };
  // const overrides: DescriptorOverrides = {
  //   displayType: DefaultContentDisplayTypes.PropertyPane,
  //   hiddenFieldNames: [],
  //   contentFlags: ContentFlags.MergeResults,
  // };
  // const c = await Presentation.presentation.getContent({
  //   imodel,
  //   rulesetOrId: RULESET,
  //   descriptor: {},
  //   keys: new KeySet(),
  // });
  // console.log(c);
}
async function ClearClip() {
  const vp = IModelApp.viewManager.selectedView;
  if (vp) {
    IModelApp.tools.run(ViewClipClearTool.toolId);
    ViewClipDecorationProvider.create().toggleDecoration(vp);
  }
}

export async function CustomSelectEvent(ev: SelectionSetEvent) {
  if (ev.type === SelectionSetEventType.Replace) {
    const imodel = UiFramework.getIModelConnection()!;
    if (typeof ev.added === "string") {
      const id = ev.added.toString();
      const prop = imodel.getRpcProps();
      const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
        prop!,
        id
      );
      if (parentId) {
        imodel.selectionSet.emptyAll();
        imodel.selectionSet.add(parentId);
      }
    }
  }
}
async function ViewGlobeBirdToolRun() {
  IModelApp.tools.run(ViewGlobeBirdTool.toolId);

  const imodel = UiFramework.getIModelConnection()!;
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

import {
  BeButtonEvent,
  EmphasizeElements,
  FeatureOverrideType,
  HitDetail,
  IModelApp,
  IModelConnection,
  ScreenViewport,
  SelectionSetEvent,
  SelectionSetEventType,
} from "@bentley/imodeljs-frontend";
import { useEffect, useState } from "react";
import * as React from "react";
import { ColorDef, IModelRpcProps } from "@bentley/imodeljs-common";
import { Id64String } from "@bentley/bentleyjs-core";
import {
  AspectsData,
  PropertiesRpcInterface,
} from "../../../common/PropertiesRpcInterface";
import { Tree } from "antd";
import "antd/dist/antd.css";
import { ParityRegion } from "@bentley/geometry-core";
import { UiFramework } from "@bentley/ui-framework";
export function changeColor(vp: ScreenViewport, ids: Id64String[]) {
  const emph = EmphasizeElements.getOrCreate(vp);
  emph.wantEmphasis = true;
  const om = emph.getOverriddenElements();
  if (om?.values !== undefined) {
    om.forEach((_idSet, key) => {
      emph.clearOverriddenElements(vp, key);
    });
  }

  const color: ColorDef = ColorDef.from(255, 0, 255, 10); //透明度
  emph.overrideElements(
    ids,
    vp,
    color,
    FeatureOverrideType.ColorAndAlpha,
    false
  );
}
//仅仅用户DeviceTree中hook初始状态;
const initTreeData = [
  {
    title: "bentley",
    key: "bentley",
    isLeaf: true,
  },
];

//设备树组件;
export function DeviceTree() {
  const [treeData, setTreeData] = useState<any>(initTreeData);
  useEffect(() => {
    (async function () {
      const data = await DeviceTreeManage.GetDeviceData();
      setTreeData(data);
    })();
  }, []);

  const OnSelectDeviceTreeNode = (selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length > 0) {
      const elementId = DeviceTreeManage.GetSelectedElementIdByNameOrGuid(
        info.node.title
      );
      if (elementId) {
        (async function () {
          DeviceTreeManage.HandleSelectedDevice(elementId);
        })();
      }
    }
  };

  return (
    <Tree
      multiple
      defaultExpandAll={true}
      defaultExpandParent={true}
      treeData={treeData}
      showLine={true}
      autoExpandParent={true}
      showIcon={true}
      onSelect={OnSelectDeviceTreeNode}
    />
  );
}
interface DeviceDataType {
  parent: string;
  child: string;
  tag: string;
  elementId?: string;
  inDoor?: boolean; //true:室内，false:室外;
}

enum DeviceRelevantIdentifier {
  build = "建筑",
  room = "房间",
  device = "设备",
}
//设备树管理类，其主要负责管理设备树的数据内容;
class DeviceTreeManage {
  /*如果同一个imodel中的设备名字会重复，请换成GUID作为映射键。*/
  public static DeviceToElementMap: Map<
    string /*iModelID*/,
    Map<string /*设备名字或GUID*/, string /*设备ElementID*/>
  > = new Map<string, Map<string, string>>(); //设备GUID与Element之间的映射关系;

  public static GetSelectedElementIdByNameOrGuid(name: string) {
    let elementId: string | undefined = undefined;
    const imodel = UiFramework.getIModelConnection()!;
    if (this.DeviceToElementMap.has(imodel.iModelId!)) {
      const mp = this.DeviceToElementMap.get(imodel.iModelId!)!;
      if (mp.has(name)) {
        elementId = mp.get(name);
      }
    }
    return elementId;
  }
  public static treeNodeCount: number = 0; //其用于DeviceTree树的节点的Key值,保持唯一即可。

  private static GenerateCustomDeviceData(dataList: AspectsData[]) {
    const datas: DeviceDataType[] = [];
    dataList.forEach((element) => {
      const data: any[] = element.AdditionalAttributes.children;
      const build = data.find((e) => {
        return e.name === "buildName";
      });
      const room = data.find((e) => {
        return e.name === "roomName";
      });
      const guid = data.find((e) => {
        return e.name === "gUID";
      });
      const cabinetName = data.find((e) => {
        return e.name === "cabinetName";
      });
      if (build && room && guid && cabinetName) {
        const isInDoor: boolean = build.value !== "" ? true : false;
        const DoorType: string = build.value !== "" ? "室内" : "室外";
        const newBuild = {
          parent: DoorType,
          child: build.value,
          tag: DeviceRelevantIdentifier.build,
          inDoor: isInDoor,
        };
        if (this.IsExist(datas, newBuild)) {
          //添加建筑;
          datas.push(newBuild);
        }
        const newRoom = {
          parent: build.value,
          child: room.value,
          tag: DeviceRelevantIdentifier.room,
        };
        if (this.IsExist(datas, newRoom)) {
          //添加房间;
          datas.push(newRoom);
        }
        const newDevice = {
          parent: room.value,
          child: cabinetName.value,
          tag: DeviceRelevantIdentifier.device,
          elementId: element.ElementId,
        };
        if (this.IsExist(datas, newDevice)) {
          //添加设备;
          datas.push(newDevice);
        }
      }
    });

    //创建设备与Element之间的映射关系;

    const mp: Map<string, string> = new Map<string, string>();
    datas.forEach((data) => {
      if (data.tag === DeviceRelevantIdentifier.device) {
        mp.set(data.child, data.elementId!);
      }
    });
    const imodel = UiFramework.getIModelConnection()!;
    this.DeviceToElementMap.set(imodel.iModelId!, mp);
    return datas;
  }
  public static DeviceDataMap: Map<string, any> = new Map<string, any>();
  public static async GetDeviceData() {
    const imodel = UiFramework.getIModelConnection()!;
    if (this.DeviceDataMap.has(imodel.iModelId!)) {
      console.log("here");
      return this.DeviceDataMap.get(imodel.iModelId!);
    }
    const data = await this.GetDeviceDataBackEnd();
    console.log("从后台获取数据");
    this.DeviceDataMap.set(imodel.iModelId!, data);
    return data;
  }
  public static async GetDeviceDataBackEnd() {
    const imodel = IModelApp.viewManager.selectedView?.view.iModel;
    const prop = imodel?.getRpcProps();

    const dataList: AspectsData[] = await PropertiesRpcInterface.getClient().getDeviceAspects(
      prop!
    );
    if (!dataList.length) {
      return;
    }
    const datas = this.GenerateCustomDeviceData(dataList);
    return this.GenerateDeviceTreeData(datas);
  }

  private static GenerateDeviceTreeData(datas: DeviceDataType[]) {
    //生成室内树节点数据;
    const InDoorBuild = this.GenerateTreeNodeData(datas, true);
    //生成室内树节点数据;
    const OutDoorBuild = this.GenerateTreeNodeData(datas, false);

    const DeviceTreeData = [
      {
        title: "室内",
        key: this.treeNodeCount++,
        children: InDoorBuild,
      },
      {
        title: "室外",
        key: this.treeNodeCount++,
        children: OutDoorBuild,
      },
    ];
    return DeviceTreeData;
  }

  private static GenerateTreeNodeData(
    datas: DeviceDataType[],
    isInDoor: boolean
  ) {
    const builds = datas.filter(
      (e) => e.tag === DeviceRelevantIdentifier.build && e.inDoor === isInDoor
    );

    const buildHasRoom: {
      title: string;
      key: number;
      children: {
        title: string;
        key: number;
        children: { title: string; key: number; isLeaf: boolean }[];
      }[];
    }[] = [];

    builds.forEach((e) => {
      const rooms = datas.filter((x) => {
        return x.tag === DeviceRelevantIdentifier.room && x.parent === e.child;
      });
      const roomHasDevice: {
        title: string;
        key: number;
        children: { title: string; key: number; isLeaf: boolean }[];
      }[] = [];
      rooms.forEach((room) => {
        const devices = datas.filter((y) => {
          return (
            y.tag === DeviceRelevantIdentifier.device && y.parent === room.child
          );
        });
        const deviceGuid: {
          title: string;
          key: number;
          isLeaf: boolean;
        }[] = [];
        devices.forEach((dd) => {
          deviceGuid.push({
            title: dd.child,
            key: this.treeNodeCount++,
            isLeaf: true,
          });
        });
        roomHasDevice.push({
          title: room.child,
          key: this.treeNodeCount++,
          children: deviceGuid,
        });
      });
      buildHasRoom.push({
        title: e.child,
        key: this.treeNodeCount++,
        children: roomHasDevice,
      });
    });
    return buildHasRoom;
  }

  private static IsExist(datas: DeviceDataType[], item: DeviceDataType) {
    const result = datas.find((e) => {
      return (
        e.parent === item.parent && e.child === item.child && e.tag === item.tag
      );
    });
    return result === undefined;
  }

  public static async HandleSelectedDevice(elementId: string) {
    const imodel = IModelApp.viewManager.selectedView?.view.iModel;
    if (imodel) {
      imodel.selectionSet.emptyAll();
      imodel.hilited.clear();
      const prop = imodel?.getRpcProps();
      const ids = await PropertiesRpcInterface.getClient().getElementChildIds(
        prop!,
        elementId
      );
      const vp = IModelApp.viewManager.selectedView!;
      changeColor(vp, ids);
      vp.zoomToElements(ids, { animateFrustumChange: true });
      const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
        prop!,
        elementId
      );
      if (parentId) {
        imodel.selectionSet.add(parentId);
      }
    }
  }
}

export async function getTopAssemblyProperties(
  token: IModelRpcProps,
  instanceId: string
) {
  try {
    return await PropertiesRpcInterface.getClient().getTopAssemblyProperties(
      token,
      instanceId
    );
  } catch (error) {}
}

export async function SelectElement(_ev: BeButtonEvent, _currHit?: HitDetail) {
  const vp = IModelApp.viewManager.selectedView!;
  const imodel = IModelApp.viewManager.selectedView?.view.iModel;
  if (imodel && _currHit) {
    imodel.selectionSet.emptyAll();
    imodel.hilited.clear();
    const prop = imodel.getRpcProps();
    const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
      prop!,
      _currHit.sourceId
    );
    if (parentId) {
      imodel.selectionSet.add(parentId);
    }
  }
  const emph = EmphasizeElements.getOrCreate(vp);
  emph.wantEmphasis = true;
  const om = emph.getOverriddenElements();
  if (om?.values !== undefined) {
    om.forEach((_idSet, key) => {
      emph.clearOverriddenElements(vp, key);
    });
  }
  if (_currHit && _currHit.isElementHit && imodel) {
    const prop = imodel.getRpcProps();
    const ids = await PropertiesRpcInterface.getClient().getDeviceAllChildElements(
      prop!,
      _currHit.sourceId
    );
    if (ids.length !== 0) {
      changeColor(vp, ids);
    }
    const parentId = await PropertiesRpcInterface.getClient().getParentElementId(
      prop!,
      _currHit.sourceId
    );
  }
}
export function ClearSelectedDevice(ev: SelectionSetEvent) {
  if (ev.type === SelectionSetEventType.Clear) {
    const vp = IModelApp.viewManager.selectedView;
    if (vp) {
      const emph = EmphasizeElements.getOrCreate(vp);
      emph.wantEmphasis = true;
      const om = emph.getOverriddenElements();
      if (om?.values !== undefined) {
        om.forEach((_idSet, key) => {
          emph.clearOverriddenElements(vp, key);
        });
      }
    }
  }
}

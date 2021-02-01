import { Id64String } from "@bentley/bentleyjs-core";
import { IModelDb } from "@bentley/imodeljs-backend";
import {
  IModelRpcProps,
  RpcInterface,
  RpcManager,
} from "@bentley/imodeljs-common";
import {
  PropertiesRpcInterface,
  RobotWorldReadRpcInterface,
} from "../common/PropertiesRpcInterface";

import * as propertiesRpcService from "./service";

export class PropertiesRpcImpl extends PropertiesRpcInterface {
  public static register() {
    RpcManager.registerImpl(PropertiesRpcInterface, PropertiesRpcImpl);
  }

  public async getElementProperties(
    token: IModelRpcProps,
    elementId: string,
    wantGeometry = false,
    wantBRepData = false
  ) {
    const db = IModelDb.tryFindByKey(token.key);

    if (!db) {
      throw new Error("Failed to find db");
    }

    return propertiesRpcService.getElementProperties(
      db,
      elementId,
      wantGeometry,
      wantBRepData
    );
  }

  public async getAssemblyProperties(token: IModelRpcProps, elementId: string) {
    const db = IModelDb.tryFindByKey(token.key);

    if (!db) {
      throw new Error("Failed to find db");
    }

    return propertiesRpcService.getAssemblyProperties(db, elementId);
  }

  public async getTopAssemblyProperties(
    token: IModelRpcProps,
    elementId: string
  ) {
    const db = IModelDb.tryFindByKey(token.key);

    if (!db) {
      throw new Error("Failed to find db");
    }

    return propertiesRpcService.getTopAssemblyProperties(db, elementId);
  }
  public async getDeviceAspects(token: IModelRpcProps) {
    const db = IModelDb.tryFindByKey(token.key);
    if (!db) {
      throw new Error("Failed to find db");
    }
    return propertiesRpcService.getDeviceAspects(db);
  }

  public async getElementChildIds(token: IModelRpcProps, elementId: string) {
    const db = IModelDb.tryFindByKey(token.key);
    if (!db) {
      throw new Error("Failed to find db");
    }
    return propertiesRpcService.getElementChildIds(db, elementId);
  }

  /**如果_elementId为设备Element的Id，则返回当前设备的所有Child Element的id集合，否则返回为空 */
  public async getDeviceAllChildElements(
    token: IModelRpcProps,
    _elementId: string
  ): Promise<string[]> {
    const db = IModelDb.tryFindByKey(token.key);
    if (!db) {
      throw new Error("Failed to find db");
    }
    return propertiesRpcService.getDeviceAllChildElements(db, _elementId);
  }
  public async getParentElementId(
    token: IModelRpcProps,
    _elementId: string
  ): Promise<string | undefined> {
    const db = IModelDb.tryFindByKey(token.key);
    if (!db) {
      throw new Error("Failed to find db");
    }
    return propertiesRpcService.getParentElementId(db, _elementId);
  }
}

// Implement RobotWorldReadRpcInterface
export class RobotWorldReadRpcImpl
  extends RpcInterface
  implements RobotWorldReadRpcInterface {
  public async countRobotsInArray(
    tokenProps: IModelRpcProps,
    elemIds: Id64String[]
  ): Promise<number> {
    const iModelDb: IModelDb = IModelDb.findByKey(tokenProps.key);
    console.log(elemIds.length);
    return 100;
  }

  public async countRobots(tokenProps: IModelRpcProps): Promise<number> {
    const iModelDb: IModelDb = IModelDb.findByKey(tokenProps.key);
    return 200;
  }

  public async queryObstaclesHitByRobot(
    tokenProps: IModelRpcProps,
    rid: Id64String
  ): Promise<Id64String[]> {
    const iModelDb: IModelDb = IModelDb.findByKey(tokenProps.key);
    console.log(rid.length);
    return ["2020"];
  }
}

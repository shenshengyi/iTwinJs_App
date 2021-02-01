import { Id64String } from "@bentley/bentleyjs-core";
import {
  RpcInterface,
  RpcManager,
  IModelRpcProps,
} from "@bentley/imodeljs-common";
export interface AspectsData {
  ElementId: string;
  LevelName: any;
  AdditionalAttributes: any;
}
export class PropertiesRpcInterface extends RpcInterface {
  public static interfaceName = "PropertiesRpcInterface";

  public static interfaceVersion = "1.0.0";

  public static types: () => any = () => [];

  public static getClient() {
    return RpcManager.getClientForInterface(PropertiesRpcInterface);
  }

  public getElementProperties(
    _token: IModelRpcProps,
    _elementId: string,
    _wantGeometry = false,
    _wantBRepData = false
  ) {
    return this.forward(arguments);
  }

  public getAssemblyProperties(_token: IModelRpcProps, _elementId: string) {
    return this.forward(arguments);
  }

  public getTopAssemblyProperties(_token: IModelRpcProps, _elementId: string) {
    return this.forward(arguments);
  }
  public getDeviceAspects(_token: IModelRpcProps) {
    return this.forward(arguments);
  }
  public getElementChildIds(_token: IModelRpcProps, _elementId: string) {
    return this.forward(arguments);
  }
  /**如果_elementId为设备Element的Id，则返回当前设备的所有Child Element的id集合，否则返回为空 */
  public getDeviceAllChildElements(
    _token: IModelRpcProps,
    _elementId: string
  ): Promise<string[]> {
    return this.forward(arguments);
  }
  public getParentElementId(
    _token: IModelRpcProps,
    _elementId: string
  ): Promise<string|undefined> {
    return this.forward(arguments);
  }
}

// The RPC query interface that may be exposed by the RobotWorldEngine.
export abstract class RobotWorldReadRpcInterface extends RpcInterface {
  public static readonly interfaceName = "RobotWorldReadRpcInterface"; // The immutable name of the interface
  public static interfaceVersion = "1.0.0"; // The API version of the interface
  public static getClient() {
    return RpcManager.getClientForInterface(this);
  }
  public async countRobotsInArray(
    _iModelToken: IModelRpcProps,
    _elemIds: Id64String[]
  ): Promise<number> {
    return this.forward(arguments);
  }
  public async countRobots(_iModelToken: IModelRpcProps): Promise<number> {
    return this.forward(arguments);
  }
  public async queryObstaclesHitByRobot(
    _iModelToken: IModelRpcProps,
    _rid: Id64String
  ): Promise<Id64String[]> {
    return this.forward(arguments);
  }
}

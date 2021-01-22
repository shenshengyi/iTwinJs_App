/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelRpcProps, RpcInterface, RpcManager } from "@bentley/imodeljs-common";

/** Display Performance RPC interface. */
export default class ExportIFCInterface extends RpcInterface {
  /** The immutable name of the interface. */
  public static readonly interfaceName = "ExportIFCInterface";

  /** The version of the interface. */
  public static interfaceVersion = "1.0.0";

  /** The types that can be marshaled by the interface. */
  public static types = () => [];

  public static getClient(): ExportIFCInterface { return RpcManager.getClientForInterface(ExportIFCInterface); }
  public ExportIFCToFile(_token: IModelRpcProps,_ifc_version:string,) :Promise<void>{return this.forward(arguments);}
}

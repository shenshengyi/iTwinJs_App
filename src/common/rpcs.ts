/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Editor3dRpcInterface, IModelReadRpcInterface, IModelTileRpcInterface, IModelWriteRpcInterface, RpcInterfaceDefinition, SnapshotIModelRpcInterface } from "@bentley/imodeljs-common";
import { PresentationRpcInterface } from "@bentley/presentation-common";
import ExportIFCInterface from "./ExportIFCInterface";
import { PropertiesRpcInterface, RobotWorldReadRpcInterface } from "./PropertiesRpcInterface";
import SVTRpcInterface from "./SVTRpcInterface";


/**
 * Returns a list of RPCs supported by this application
 */
export function getSupportedRpcs(): RpcInterfaceDefinition[] {
  return [
    IModelReadRpcInterface,
    IModelTileRpcInterface,
    PresentationRpcInterface,
    SnapshotIModelRpcInterface,
    IModelWriteRpcInterface,
    Editor3dRpcInterface,
    SVTRpcInterface,
    PropertiesRpcInterface,
    RobotWorldReadRpcInterface,
    ExportIFCInterface,
  ];
}

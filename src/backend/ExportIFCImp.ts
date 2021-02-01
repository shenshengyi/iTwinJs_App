/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as process from "child_process";
import { IModelRpcProps, RpcManager } from "@bentley/imodeljs-common";
import ExportIFCInterface from "../common/ExportIFCInterface";
import { IModelHost } from "@bentley/imodeljs-backend";
import { BriefcaseQuery } from "@bentley/imodelhub-client";
import { createRequestContext } from "./CustomRequestContext";

/** The backend implementation of SVTRpcImpl. */
export default class ExportImp extends ExportIFCInterface {
  public static register() {
      RpcManager.registerImpl(ExportIFCInterface, ExportImp);
  }

    public ExportIFCToFile(_token: IModelRpcProps, _ifc_version: string): Promise<void>{
        return  this.ExportIFC(_token,_ifc_version);
    }
    private async ExportIFC(token: IModelRpcProps, _ifc_version: string) {
        console.log(token);
        const imodelid = "dd96cb83-95c3-42c4-9295-3c5cd4ec95bc";
        // const requestContext = await AuthorizedBackendRequestContext.create("2686");
        // const requestContext = await new AuthorizedBackendRequestContext("");
        // console.log(requestContext);
        // const t = await IModelHost.getAccessToken();
        // console.log(t);
        // const r = await IModelHost.iModelClient.briefcases.get(requestContext, imodelid);
        // if (r) {
        // }
        
        // const t = await IModelHost.authorizationClient!.getAccessToken();
        // console.log(t);
        const req = createRequestContext();
    //     const changeSets: ChangeSet[] = await IModelHost.iModelClient.changeSets.get(requestContext, imodelid, new ChangeSetQuery().selectDownloadUrl());
       
    //     if (changeSets&&changeSets.length > 0) {
    //         const filepath = "D:\\downloadBim\\nba.bim";
    //         const filepath1 = "D:\\downloadBim\\nba.cs";
    //             const csQuery1 = new ChangeSetQuery();
    // csQuery1.byId(changeSets[0].id!);
    //         await IModelHost.iModelClient.changeSets.download(requestContext, imodelid,csQuery1 , filepath1);
    //     }
        // const r = await IModelHost.iModelClient.briefcases.get(requestContext, imodelid, new BriefcaseQuery().selectDownloadUrl());
        // console.log(r);
        // if (r && r.length > 0) {
        //     console.log("r =" + r.length.toString());
        //     const filepath = "D:\\downloadBim\\nba.bim";
        //     await IModelHost.iModelClient.briefcases.download(requestContext, r[0], filepath);
        // }
       
        const bs = await IModelHost.iModelClient.briefcases.get(req, imodelid, new BriefcaseQuery().selectDownloadUrl());
        if (bs && bs.length > 0) {
            console.log(bs[0]);
            const filepath = "D:\\downloadBim\\cba.bim";
            await IModelHost.iModelClient.briefcases.download(req, bs[0], filepath);
        }
    // const downloadOptions = { syncMode: SyncMode.PullOnly };
    // const briefcaseProps = await BriefcaseManager.download(
    //   requestContext,
    //   context_id,
    //   imodelid,
    //   downloadOptions,
    //    IModelVersion.latest()
    // );
        console.log("下载完成");
        // console.log(briefcaseProps);
    }
}



/** Auto-register the impl when this file is included. */


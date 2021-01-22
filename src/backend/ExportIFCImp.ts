/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as process from "child_process";
import { IModelRpcProps, IModelVersion, RpcConfiguration, RpcManager, SyncMode } from "@bentley/imodeljs-common";
import ExportIFCInterface from "../common/ExportIFCInterface";
import { AuthorizedBackendRequestContext, BriefcaseManager, IModelDb, IModelHost } from "@bentley/imodeljs-backend";
import { Config } from "@bentley/bentleyjs-core";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { parseBasicAccessToken } from "./BasicAuthorization";
import { BrowserAuthorizationCallbackHandler } from "@bentley/frontend-authorization-client";
import { createRequestContext, MockAccessToken } from "./webmain";
import { BriefcaseQuery, ChangeSet, ChangeSetQuery } from "@bentley/imodelhub-client";

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
        const context_id = "acd4f071-02d8-4c62-8af3-6b2c77b19a5c";
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

async function Run() {
const exec = process.execFile;
     const exePath = "D://C++_Study//ExportIFC//x64//Release//ExportIFC.exe";
    if (fs.existsSync(exePath)) {
    console.log("exe存在");
} else {
        console.log("exe不存在");
        return;
}
const fun =function(){
   exec(exePath, ['nihao','chen','yazi'],function(err:any, data:any) {  
        console.log(err)
        console.log(data.toString());                       
    });  
}
fun();
}


/** Auto-register the impl when this file is included. */


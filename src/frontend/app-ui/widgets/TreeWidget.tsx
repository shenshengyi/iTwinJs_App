/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import {
  ISelectionProvider,
  Presentation,
  SelectionChangeEventArgs,
} from "@bentley/presentation-frontend";
import {
  CategoryTree,
  ConfigurableCreateInfo,
  ModelsTree,
  UiFramework,
  WidgetControl,
} from "@bentley/ui-framework";
import { AutoComplete } from "antd";
import * as React from "react";
import SimpleTreeComponent from "../../components/Tree";
import { DeviceTree } from "./DeviceTree";
import { TestTree2021 } from "./TestTree";
/** A widget control for displaying the Tree React component */
export class TreeWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);
    const vp = IModelApp.viewManager.selectedView;
    if (options.iModelConnection && vp) {
      this.reactNode = (
        <ModelsTree iModel={options.iModelConnection} activeView={vp} />
      );
    }
  }
}
/** A widget control for displaying the Tree React component */
export class TreeWidget2021 extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);
    const vp = IModelApp.viewManager.selectedView;
    if (options.iModelConnection && vp) {
      this.reactNode = (
        <CategoryTree iModel={options.iModelConnection} activeView={vp} />
      );
    }
  }
}
/** A widget control for displaying the Tree React component */
export class DeviceWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactNode = (
        <div style={{ overflow: "auto" }}>
          <DeviceTree />
        </div>
      );
    }
  }
}
/** A widget control for displaying the Tree React component */
export class TestWidget20212021 extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactNode = (
        <div style={{ overflow: "auto" }}>
          <TestTree2021 />
        </div>
      );
    }
  }
}
export class DeviceWidgetTest extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactNode = <TestTable />;
    }
  }
}

function TestTable() {
  const [category, setCategory] = React.useState("Default");

  async function TestAsync(
    _args: SelectionChangeEventArgs,
    _provider: ISelectionProvider
  ) {
    if (_args.source === "Tool") {
      const imodel = _args.imodel;
      if (imodel) {
        const hells = await Presentation.selection.getHiliteSet(imodel);
        if (hells && hells.elements && hells.elements.length > 0) {
          const e = await imodel.elements.getProps(hells.elements[0]);
          if (e && e.length > 0) {
            const geomEle: string = (e[0] as any).category;

            if (geomEle) {
              const catProp = await imodel.elements.getProps(geomEle);
              if (catProp && catProp.length > 0) {
                const c = catProp[0];
                if (c && c.code && c.code.value) {
                  setCategory(c.code.value);
                }
              }
            }
          }
        }
      }
    }
  }
  Presentation.selection.selectionChange.addListener(TestAsync);
  return <div>显示图层: {category}</div>;
}

// function TestTable(prop: Prop) {
//   const [id, setId] = React.useState("");
//   const [category, setCategory] = React.useState("Default");
//   React.useEffect(() => {
//     (async function () {
//         const e = await prop.imodel.elements.getProps(id);
//         if (e && e.length > 0) {
//           const geomEle: string = (e[0] as any).category;
//           if (geomEle) {
//             const catProp = await prop.imodel.elements.getProps(geomEle);
//             if (catProp && catProp.length > 0) {
//               const c = catProp[0];
//               if (c && c.code && c.code.value) {
//                 setCategory(c.code.value);
//               }
//             }
//           }
//         }
//     })();
//   }, [id, prop.imodel]);
//   async function TestAsync(
//     _args: SelectionChangeEventArgs,
//     _provider: ISelectionProvider
//   ) {
//     if (_args.source === "Tool") {
//       const imodel = _args.imodel;
//       if (imodel) {
//         const hells = await Presentation.selection.getHiliteSet(imodel);
//         if (hells && hells.elements && hells.elements.length > 0) {
//           setId(hells.elements[0]);
//         }
//       }
//     }
//   }
//   Presentation.selection.selectionChange.addListener(TestAsync);
//   return <div>显示图层: {category}</div>;
// }

/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import {
  PresentationPropertyDataProvider,
  usePropertyDataProviderWithUnifiedSelection,
} from "@bentley/presentation-components";
import { FillCentered, Orientation, useDisposable } from "@bentley/ui-core";
import {
  PropertyCategory,
  PropertyData,
  VirtualizedPropertyGridWithDataProvider,
} from "@bentley/ui-components";
import {
  PropertyDescription,
  PropertyRecord,
  PropertyValue,
  PropertyValueFormat,
  StandardTypeNames,
} from "@bentley/ui-abstract";

/** React properties for the property grid component */
export interface Props {
  /** iModel whose contents should be displayed in the property grid */
  imodel: IModelConnection;
  /** Orientation of the PropertyGrid rows */
  orientation: Orientation;
}

/** Property grid component for the viewer app */
export default function SimplePropertiesComponent(props: Props) {
  // eslint-disable-line @typescript-eslint/naming-convention
  const dataProvider = useDisposable(
    React.useCallback(
      () => new AutoExpandingPropertyDataProvider({ imodel: props.imodel }),
      [props.imodel]
    )
  );
  const { isOverLimit } = usePropertyDataProviderWithUnifiedSelection({
    dataProvider,
  });
  let content: JSX.Element;
  if (isOverLimit) {
    content = <FillCentered>{"Too many elements."}</FillCentered>;
  } else {
    content = (
      <VirtualizedPropertyGridWithDataProvider
        dataProvider={dataProvider}
        isPropertyHoverEnabled={true}
        orientation={Orientation.Horizontal}
        horizontalOrientationMinWidth={500}
        onPropertySelectionChanged={ProEvent}
        isPropertySelectionEnabled={true}
      />
    );
  }

  return content;
}

async function ProEvent(_record: PropertyRecord) {
  // window.open("www.baidu.com", "_blank")!.focus();
}
const value1: PropertyValue = {
  valueFormat: PropertyValueFormat.Primitive,
  value: 3,
};
const getPropertyDescription = (): PropertyDescription => {
  return {
    name: "Item1",
    displayLabel: "Item One",
    typename: StandardTypeNames.Number,
  };
};
class AutoExpandingPropertyDataProvider extends PresentationPropertyDataProvider {
  public async getData(): Promise<PropertyData> {
    const result = await super.getData();
    this.expandCategories(result.categories);
    return result;
    // console.log(result);

    // if (result && result.categories && result.categories.length === 4) {
    //   return result;
    // }
    // const sut = new PropertyRecord(value1, getPropertyDescription());
    // const data: PropertyData = { label: sut, categories: [], records: {} };

    // return data;
  }

  private expandCategories(categories: PropertyCategory[]) {
    categories.forEach((category: PropertyCategory) => {
      category.expand = true;
      if (category.childCategories)
        this.expandCategories(category.childCategories);
    });
  }
}

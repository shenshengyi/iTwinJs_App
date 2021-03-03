import { useEffect, useState } from "react";
import * as React from "react";
import { Tree } from "antd";
import "antd/dist/antd.css";
//仅仅用户DeviceTree中hook初始状态;
const initTreeData = [
  {
    title: "bentley",
    key: "bentley",
    isLeaf: true,
  },
];

const newData = [
  {
    title: "bentley",
    key: "bentley1",
    isLeaf: true,
  },
  {
    title: "bentley",
    key: "bentley2",
    isLeaf: true,
  },
  {
    title: "bentley",
    key: "bentley3",
    isLeaf: true,
  },
  {
    title: "bentley",
    key: "bentley4",
    isLeaf: true,
  },
  {
    title: "bentley",
    key: "bentley5",
    isLeaf: true,
  },
  {
    title: "bentley",
    key: "bentley6",
    isLeaf: true,
  },
];
export function TestTree2021() {
  const [treeData, setTreeData] = useState<any>(initTreeData);
  useEffect(() => {
    (async function () {
      setTreeData(newData);
    })();
  }, []);
  return (
    <Tree
      multiple
      defaultExpandAll={true}
      defaultExpandParent={true}
      treeData={treeData}
      showLine={true}
      autoExpandParent={true}
      showIcon={true}
    />
  );
}

import { Loader } from "semantic-ui-react";
import { Tree, TreeLeaf, TreeRoot } from "./Tree";
import HorizontalScroll from "../HorizontalScroll";
import { useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { uniqueNamesGenerator, colors, animals } from "unique-names-generator";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TreeLeafDragLayer from "./dnd/TreeLeafDragLayer";
import { TreeItem } from "../../types/skillTree";
import { SkillTreeContext } from "../../routes/SkillTreeContext";
import { TreeChildren, TreeHierarchy } from "./TreeHierarchy";

function populateChildren(
  parent: TreeItem,
  children: TreeItem[],
  activeItem: TreeItem | null,
  onClick: (node: TreeItem, parent: TreeItem) => void,
  onAddChildClick: (node: TreeItem) => void,
  onAddSiblingClick: (node: TreeItem) => void,
  onLoadMoreClick: (node: TreeItem) => void,
  onCollapseClick: (node: TreeItem) => void
) {
  return children.map((child) => {
    return populateChild(
      parent,
      child,
      activeItem,
      onClick,
      onAddChildClick,
      onAddSiblingClick,
      onLoadMoreClick,
      onCollapseClick
    );
  });
}

export function populateChild(
  parent: TreeItem,
  child: TreeItem,
  activeItem: TreeItem | null,
  onClick: (node: TreeItem, parent: TreeItem) => void,
  onAddChildClick: (node: TreeItem) => void,
  onAddSiblingClick: (node: TreeItem) => void,
  onLoadMoreClick: (node: TreeItem) => void,
  onCollapseClick: (node: TreeItem) => void
) {
  return (
    <TreeHierarchy
      itemProps={{
        parent: parent,
        data: child,
      }}
      key={`skill-tree__hierarchy__${child.uuid}`}
    >
      <TreeLeaf
        parent={parent}
        data={child}
        isActive={activeItem !== null && child.uuid === activeItem.uuid}
        onClick={onClick}
        onAddChildClick={onAddChildClick}
        onAddSiblingClick={onAddSiblingClick}
        onLoadMoreClick={onLoadMoreClick}
        onCollapseClick={onCollapseClick}
      />

      {child.children && (
        <TreeChildren>
          {populateChildren(
            child,
            child.children as TreeItem[],
            activeItem,
            onClick,
            onAddChildClick,
            onAddSiblingClick,
            onLoadMoreClick,
            onCollapseClick
          )}
        </TreeChildren>
      )}
    </TreeHierarchy>
  );
}

export default function TreeView() {
  const context = useContext(SkillTreeContext);

  if (!context) {
    throw new Error('TreeView must be used within a SkillTreeContext');
  }

  const { treeData, state, dispatch, handleLoadMore, handleCollapse, selectedLeafRef } = context
  const { data, isPending, isSuccess } = treeData;

  useEffect(() => {
    if (state.selectedNodeId && selectedLeafRef.current) {
      setTimeout(() => {
        selectedLeafRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500)
    }
  }, [state.selectedNodeId]);

  function handleClick(node: TreeItem, parent: TreeItem) {
    console.log(JSON.stringify({ node, parent }));
    dispatch({ type: "node/select", node: node, parent: parent });
  }

  function createNewNode() {
    return {
      uuid: uuidv4(),
      name: uniqueNamesGenerator({
        dictionaries: [colors, animals],
        style: "capital",
        separator: " ",
      }),
      children: [],
      isDeleted: false,
      isCollapsed: false,
    };
  }

  function handleAddChild(node: TreeItem) {
    const newNode = createNewNode();
    treeData.createNodeMutation
      ?.mutateAsync({ node: newNode, parentUuid: node.uuid })
      .then(() => {
        handleClick(newNode, node);
      });
  }

  return (
    <HorizontalScroll className="body--full-screen">
      {isPending && <Loader active content="Loading..." />}
      {isSuccess && data?.children && (
        <DndProvider backend={HTML5Backend}>
          <Tree>
            <TreeLeafDragLayer />
            <TreeRoot />
            <TreeChildren>
              {populateChildren(
                data,
                data.children,
                state.selectedNode,
                handleClick,
                handleAddChild,
                handleAddChild,
                handleLoadMore,
                handleCollapse
              )}
            </TreeChildren>
          </Tree>
        </DndProvider>
      )}
    </HorizontalScroll>
  );
}
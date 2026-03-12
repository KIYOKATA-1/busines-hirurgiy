export type BoardStatus = "DRAFT" | "ACTIVE" | string;

export type CanvasPoint = {
  x: number;
  y: number;
};

export type BoardListItem = {
  id: string;
  rootTopicId: string | null;
  status: BoardStatus;
  title: string;
  version: number;
};

export type BoardSnapshot = {
  direction: string;
  id: string;
  layoutType: string;
  rootAnchor?: CanvasPoint;
  rootTopicId: string | null;
  status: BoardStatus;
  title: string;
  version: number;
};

export type TopicCore = {
  height: number;
  id: string;
  title: string;
  width: number;
  x: number;
  y: number;
};

export type Topic = TopicCore & {
  inDegree: number;
  outDegree: number;
};

export type Link = {
  childTopicId: string;
  id: string;
  parentTopicId: string;
};

export type Relationship = {
  id: string;
  label: string | null;
  sourceTopicId: string;
  targetTopicId: string;
  type: string;
};

export type GetBoardsResponse = {
  boards: BoardListItem[];
};

export type CreateBoardRequest = {
  direction: string;
  layoutType: string;
  status?: BoardStatus;
  title: string;
};

export type CreateBoardResponse = {
  board: BoardSnapshot;
};

export type GetBoardSnapshotResponse = {
  board: BoardSnapshot;
  links: Link[];
  relationships: Relationship[];
  topics: Topic[];
};

export type CreateRootTopicRequest = {
  clientPoint: CanvasPoint;
  height: number;
  title: string;
  width: number;
};

export type CreateRootTopicResponse = {
  board: {
    id: string;
    rootAnchor: CanvasPoint;
    rootTopicId: string;
    status: BoardStatus;
    version: number;
  };
  rootTopic: TopicCore;
};

export type CreateTopicRequest = {
  clientPoint: CanvasPoint;
  height: number;
  title: string;
  width: number;
};

export type CreateTopicResponse = {
  topic: TopicCore;
  version: number;
};

export type PatchTopicRequest = Partial<{
  height: number;
  title: string;
  width: number;
  x: number;
  y: number;
}>;

export type PatchTopicResponse = {
  topic: TopicCore;
  version: number;
};

export type CreateLinkRequest = {
  childTopicId: string;
  parentTopicId: string;
};

export type CreateLinkResponse = {
  link: Link;
  version: number;
};

export interface ICreateBoardRequest {
  direction: string;
  layoutType: string;
  status?: string;
  title: string;
}

export interface IBoardEntity {
  direction?: string;
  id: string;
  layoutType?: string;
  rootTopicId: string | null;
  status: string;
  title: string;
  version: number;
}

export interface ICreateBoardResponse {
  board: IBoardEntity;
}

export interface ICanvasPoint {
  x: number;
  y: number;
}

export interface ICreateRootTopicRequest {
  clientPoint: ICanvasPoint;
  title: string;
}

export interface ICreateRootTopicResponse {
  board: {
    id: string;
    layoutType?: string;
    rootAnchor: ICanvasPoint;
    rootTopicId: string;
    status: string;
    title?: string;
    version: number;
  };
  rootTopic: {
    id: string;
    parentId: string | null;
    title: string;
  };
}

export interface IBoardTopic {
  height: number;
  id: string;
  title: string;
  width: number;
  x: number;
  y: number;
}

export interface IBoardLink {
  childTopicId: string;
  id: string;
  parentTopicId: string;
}

export interface IBoardRelationship {
  id: string;
  label: string | null;
  sourceTopicId: string;
  targetTopicId: string;
  type: string;
}

export interface IBoardsResponse {
  boards: IBoardEntity[];
}

export interface IBoardByIdResponse {
  board: IBoardEntity;
  links: IBoardLink[];
  relationships: IBoardRelationship[];
  topics: IBoardTopic[];
}

export interface ICreateTopicRequest {
  height: number;
  clientPoint: ICanvasPoint;
  title: string;
  width: number;
}

export interface ICreateTopicResponse {
  version: number;
  topic: IBoardTopic;
}

export interface ICreateLinkRequest {
  childTopicId: string;
  parentTopicId: string;
}

export interface ICreateLinkResponse {
  boardVersion: number;
  link?: IBoardLink;
}

export interface IUpdateTopicRequest {
  x: number;
  y: number;
}

export interface IUpdateTopicResponse {
  version: number;
  topic: IBoardTopic;
}

export interface IMoveTopicsRequest {
  dx: number;
  dy: number;
  topicIds: string[];
}

export interface IMoveTopicsResponse {
  boardVersion?: number;
  topics?: IBoardTopic[];
}

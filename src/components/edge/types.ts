export interface ApiCall {
  method: string;
  path: string;
  controller?: string;
  operation?: string;
  description?: string;
  controllerFilePath?: string;
  calls?: ApiCall[];
  client?: string;
  service?: string;
}

export interface ApiCallGroup extends ApiCall {
  count: number;
  childCallCount?: number;
}
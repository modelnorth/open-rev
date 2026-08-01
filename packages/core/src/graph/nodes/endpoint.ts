export interface EndpointNode {
  id: string;
  type: 'ApiEndpoint';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WEBSOCKET' | 'GRAPHQL';
  host: string;
  isSecuredTls: boolean;
}

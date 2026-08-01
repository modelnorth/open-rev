export interface ActivityNode {
  id: string;
  type: 'Activity';
  name: string;
  isExported: boolean;
  permissionRequired?: string;
  intentFilters: string[];
}

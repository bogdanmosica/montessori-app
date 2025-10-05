'use client';

/**
 * Import Tabs Component
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ENTITY_TYPES } from '@/lib/constants/import-constants';
import ImportForm from './ImportForm';

export default function ImportTabs() {
  return (
    <Tabs defaultValue={ENTITY_TYPES.TEACHER} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value={ENTITY_TYPES.TEACHER}>Teachers</TabsTrigger>
        <TabsTrigger value={ENTITY_TYPES.PARENT}>Parents</TabsTrigger>
        <TabsTrigger value={ENTITY_TYPES.CHILD}>Children</TabsTrigger>
      </TabsList>

      <TabsContent value={ENTITY_TYPES.TEACHER}>
        <ImportForm entityType={ENTITY_TYPES.TEACHER} />
      </TabsContent>

      <TabsContent value={ENTITY_TYPES.PARENT}>
        <ImportForm entityType={ENTITY_TYPES.PARENT} />
      </TabsContent>

      <TabsContent value={ENTITY_TYPES.CHILD}>
        <ImportForm entityType={ENTITY_TYPES.CHILD} />
      </TabsContent>
    </Tabs>
  );
}

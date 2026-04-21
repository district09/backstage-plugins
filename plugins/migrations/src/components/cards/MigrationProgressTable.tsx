// import {
//   catalogApiRef,
//   EntityRefLink,
//   useEntity,
// } from '@backstage/plugin-catalog-react';
// import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
// import { useApi } from '@backstage/frontend-plugin-api';
// import { migrationsApiRef } from '../../api';
// import { CatalogTableRow } from '@backstage/plugin-catalog';
// import { MigrationResults } from '../../api/types.ts';
// import {
//   StatusError,
//   StatusOK,
//   Table,
//   TableColumn,
// } from '@backstage/core-components';
// import startCase from 'lodash/startCase';
// import {
//   Entity,
//   parseEntityRef,
//   RELATION_OWNED_BY,
//   RELATION_PART_OF,
//   stringifyEntityRef,
// } from '@backstage/catalog-model';
// import { useAsync } from 'react-use';
//
// export function allChecksPassed(
//   results: MigrationResults[],
//   entity: { entity: Entity },
//   checkId: string,
// ) {
//   const rowsForThisEntity = results.filter(
//     r =>
//       r.checkId === checkId &&
//       r.componentReference === stringifyEntityRef(entity.entity),
//   );
//   return rowsForThisEntity.every(i => i.result);
// }
//
// function createColumns(
//   entity: MigrationEntityV1,
//   results: MigrationResults[],
// ): TableColumn<CatalogTableRow>[] {
//   const columns: TableColumn<CatalogTableRow>[] = entity.spec.checks.map(
//     check => {
//       return {
//         title: startCase(check.checkId),
//         field: 'entity.metadata.name',
//         customSort: (a, b) => {
//           const aPassed = allChecksPassed(results, a, check.checkId);
//           const bPassed = allChecksPassed(results, b, check.checkId);
//           if (aPassed === bPassed) {
//             return 0;
//           }
//           if (aPassed && !bPassed) {
//             return -1;
//           }
//           return 1;
//         },
//         render: (rowData: CatalogTableRow) => {
//           const allPassed = allChecksPassed(results, rowData, check.checkId);
//           if (allPassed) {
//             return <StatusOK />;
//           }
//           return <StatusError />;
//         },
//       };
//     },
//   );
//   columns.unshift({
//     title: 'Name',
//     render: (rowData: CatalogTableRow) => {
//       return <EntityRefLink entityRef={rowData.entity} />;
//     },
//   });
//   return columns;
// }
//
// // const InternalFilteredTable = ({
// //   entity,
// //   results,
// // }: {
// //   entity: MigrationEntityV1;
// //   results: MigrationResults[];
// // }) => {
// //   const { updateFilters, entities } = useEntityList();
// //
// //   useEffect(() => {
// //     updateFilters(entity.spec.entityFilter as DefaultEntityFilters);
// //   }, [entity, updateFilters, entities]);
// //
// //   return (
// //     <CatalogTable
// //       columns={createColumns(entity, results)}
// //       actions={[]}
// //       tableOptions={{
// //         showTitle: false,
// //         pageSizeOptions: [5, 10, 25, 50],
// //         pageSize: 10,
// //       }}
// //     />
// //   );
// // };
//
// export const MigrationProgressTable = () => {
//   const { entity } = useEntity<MigrationEntityV1>();
//   const migrationsApi = useApi(migrationsApiRef);
//   const catalogApi = useApi(catalogApiRef);
//   const {
//     value,
//     loading: resultsLoading,
//     error: resultsError,
//   } = useAsync(async () => {
//     const r = await migrationsApi.getMigrationResults(
//       entity as MigrationEntityV1,
//     );
//
//     const components = r.components.map(e => e.id);
//
//     const response = await catalogApi.getEntitiesByRefs({
//       entityRefs: components,
//     });
//     return {
//       entities: response.items
//         .filter(e => e !== undefined)
//         .map(
//           (e): CatalogTableRow => ({
//             entity: e,
//             resolved: {
//               name: e.metadata.name,
//               entityRef: stringifyEntityRef(e),
//               ownedByRelations:
//                 e.relations
//                   ?.filter(rel => rel.type === RELATION_OWNED_BY)
//                   .map(relation => parseEntityRef(relation.targetRef)) ?? [],
//               partOfSystemRelations:
//                 e.relations
//                   ?.map(rel => ({
//                     type: rel.type,
//                     targetRef: parseEntityRef(rel.targetRef),
//                   }))
//                   .filter(
//                     rel =>
//                       rel.targetRef.kind === 'System' &&
//                       rel.type === RELATION_PART_OF,
//                   )
//                   .map(rel => rel.targetRef) ?? [],
//             },
//           }),
//         ),
//       results: r,
//     };
//   }, [entity, migrationsApi]);
//   if (resultsLoading || resultsError || !value) {
//     return <>Loading...</>;
//   }
//
//   return (
//     <Table
//       columns={createColumns(entity, value.results)}
//       data={value.entities}
//     />
//   );
// };

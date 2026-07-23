/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { resetState } from 'src/SqlLab/actions/sqlLab';
import {
  Button,
  EmptyState,
  Flex,
  Icons,
  Popover,
  Typography,
} from '@superset-ui/core/components';
import { t } from '@apache-superset/core/translation';
import { styled, css } from '@apache-superset/core/theme';
import type { SchemaOption, CatalogOption } from 'src/hooks/apiResources';
import { DatabaseSelector, type DatabaseObject } from 'src/components';
import { EMPTY_STATE_QE_ID } from 'src/SqlLab/hooks/useQueryEditor';

import useDatabaseSelector from '../SqlEditorTopBar/useDatabaseSelector';
import TableExploreTree from '../TableExploreTree';

export interface SqlEditorLeftBarProps {
  queryEditorId: string;
<<<<<<< HEAD
  database?: DatabaseObject;
=======
>>>>>>> 6.1.0
}

const LeftBarStyles = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.sizeUnit * 2}px;

  ${({ theme }) => css`
    height: 100%;
    display: flex;
    flex-direction: column;

    .divider {
      border-bottom: 1px solid ${theme.colorSplit};
      margin: ${theme.sizeUnit * 1}px 0;
    }
  `}
`;

<<<<<<< HEAD
const SqlEditorLeftBar = ({
  database,
  queryEditorId,
}: SqlEditorLeftBarProps) => {
  const allSelectedTables = useSelector<SqlLabRootState, Table[]>(
    ({ sqlLab }) =>
      sqlLab.tables.filter(table => table.queryEditorId === queryEditorId),
    shallowEqual,
  );
  const dispatch = useDispatch();
  const queryEditor = useQueryEditor(queryEditorId, [
    'dbId',
    'catalog',
    'schema',
    'tabViewId',
  ]);
=======
const StyledDivider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colorSplit};
  margin: 0 -${({ theme }) => theme.sizeUnit * 2.5}px 0;
`;

const SqlEditorLeftBar = ({ queryEditorId }: SqlEditorLeftBarProps) => {
  const activeQEId = queryEditorId || EMPTY_STATE_QE_ID;
  const dbSelectorProps = useDatabaseSelector(activeQEId);
  const { db, catalog, schema, onDbChange, onCatalogChange, onSchemaChange } =
    dbSelectorProps;

  const dispatch = useDispatch();
  const shouldShowReset = window.location.search === '?reset=1';
>>>>>>> 6.1.0

  // Modal state for Database/Catalog/Schema selector
  const [selectorModalOpen, setSelectorModalOpen] = useState(false);
  const [modalDb, setModalDb] = useState<DatabaseObject | undefined>(undefined);
  const [modalCatalog, setModalCatalog] = useState<
    CatalogOption | null | undefined
  >(undefined);
  const [modalSchema, setModalSchema] = useState<SchemaOption | undefined>(
    undefined,
  );

  const openSelectorModal = useCallback(() => {
    setModalDb(db ?? undefined);
    setModalCatalog(
      catalog ? { label: catalog, value: catalog, title: catalog } : undefined,
    );
    setModalSchema(
      schema ? { label: schema, value: schema, title: schema } : undefined,
    );
    setSelectorModalOpen(true);
  }, [db, catalog, schema]);

  const closeSelectorModal = useCallback(() => {
    setSelectorModalOpen(false);
  }, []);

  const handleModalOk = useCallback(() => {
    if (modalDb && modalDb.id !== db?.id) {
      onDbChange?.(modalDb);
    }
<<<<<<< HEAD

    const currentTables = [...tables];
    const tablesToAdd = tableNames.filter(name => {
      const index = currentTables.findIndex(table => table.name === name);
      if (index >= 0) {
        currentTables.splice(index, 1);
        return false;
      }

      return true;
    });

    tablesToAdd.forEach(tableName => {
      dispatch(addTable(queryEditor, tableName, catalogName, schemaName));
    });

    dispatch(removeTables(currentTables));
  };

  const onToggleTable = (updatedTables: string[]) => {
    tables.forEach(table => {
      if (!updatedTables.includes(table.id.toString()) && table.expanded) {
        dispatch(collapseTable(table));
      } else if (
        updatedTables.includes(table.id.toString()) &&
        !table.expanded
      ) {
        dispatch(expandTable(table));
      }
    });
  };

  const shouldShowReset = window.location.search === '?reset=1';

  const handleCatalogChange = useCallback(
    (catalog: string | null) => {
      if (queryEditor) {
        dispatch(queryEditorSetCatalog(queryEditor, catalog));
      }
    },
    [dispatch, queryEditor],
  );

  const handleSchemaChange = useCallback(
    (schema: string) => {
      if (queryEditor) {
        dispatch(queryEditorSetSchema(queryEditor, schema));
      }
    },
    [dispatch, queryEditor],
  );

  const handleDbList = useCallback(
    (result: DatabaseObject) => {
      dispatch(setDatabases(result));
    },
    [dispatch],
  );

  const handleError = useCallback(
    (message: string) => {
      dispatch(addDangerToast(message));
    },
    [dispatch],
  );
=======
    if (modalCatalog?.value !== catalog) {
      onCatalogChange?.(modalCatalog?.value);
    }
    if (modalSchema?.value !== schema) {
      onSchemaChange?.(modalSchema?.value ?? '');
    }
    setSelectorModalOpen(false);
  }, [
    modalDb,
    modalCatalog,
    modalSchema,
    db,
    catalog,
    schema,
    onDbChange,
    onCatalogChange,
    onSchemaChange,
  ]);
>>>>>>> 6.1.0

  const handleResetState = useCallback(() => {
    dispatch(resetState());
  }, [dispatch]);

  const popoverContent = (
    <Flex
      vertical
      gap="middle"
      data-test="DatabaseSelector"
      css={css`
        min-width: 500px;
      `}
    >
      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('Select Database and Schema')}
      </Typography.Title>
      <DatabaseSelector
        key={modalDb ? modalDb.id : 'no-db'}
        db={modalDb}
        emptyState={<EmptyState />}
        getDbList={dbSelectorProps.getDbList}
        handleError={dbSelectorProps.handleError}
        onDbChange={setModalDb}
        onCatalogChange={cat =>
          setModalCatalog(
            cat ? { label: cat, value: cat, title: cat } : undefined,
          )
        }
        catalog={modalCatalog?.value}
        onSchemaChange={sch =>
          setModalSchema(
            sch ? { label: sch, value: sch, title: sch } : undefined,
          )
        }
        schema={modalSchema?.value}
        sqlLabMode={false}
      />
      <Flex justify="flex-end" gap="small">
        <Button
          buttonStyle="tertiary"
          onClick={e => {
            e?.stopPropagation();
            closeSelectorModal();
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          type="primary"
          onClick={e => {
            e?.stopPropagation();
            handleModalOk();
          }}
        >
          {t('Select')}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <LeftBarStyles data-test="sql-editor-left-bar">
<<<<<<< HEAD
      <TableSelectorMultiple
        onEmptyResults={onEmptyResults}
        emptyState={<EmptyState />}
        database={userSelectedDb}
        getDbList={handleDbList}
        handleError={handleError}
        onDbChange={onDbChange}
        onCatalogChange={handleCatalogChange}
        catalog={catalog}
        onSchemaChange={handleSchemaChange}
        schema={schema}
        onTableSelectChange={onTablesChange}
        tableValue={selectedTableNames}
        sqlLabMode
      />
      <div className="divider" />
      <StyledScrollbarContainer>
        {tables.map(table => (
          <TableElement
            table={table}
            key={table.id}
            activeKey={tables
              .filter(({ expanded }) => expanded)
              .map(({ id }) => id)}
            onChange={onToggleTable}
          />
        ))}
      </StyledScrollbarContainer>
=======
      <Popover
        content={popoverContent}
        open={selectorModalOpen}
        onOpenChange={open => !open && closeSelectorModal()}
        placement="bottomLeft"
        trigger="click"
      >
        <DatabaseSelector
          key={`db-selector-${db ? db.id : 'no-db'}:${catalog ?? 'no-catalog'}:${
            schema ?? 'no-schema'
          }`}
          {...dbSelectorProps}
          emptyState={<EmptyState />}
          sqlLabMode
          onOpenModal={openSelectorModal}
        />
      </Popover>
      <StyledDivider />
      <TableExploreTree queryEditorId={activeQEId} />
>>>>>>> 6.1.0
      {shouldShowReset && (
        <Button
          buttonSize="small"
          buttonStyle="danger"
          onClick={handleResetState}
        >
          <Icons.ClearOutlined /> {t('Reset state')}
        </Button>
      )}
    </LeftBarStyles>
  );
};

export default SqlEditorLeftBar;

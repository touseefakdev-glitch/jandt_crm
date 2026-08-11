import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImportJob } from '../../types';
import { localDb } from '../../services/db';
import { formatDate } from '../../utils/format';
import { downloadErrorReportCSV } from '../../utils/csvImporter';
import { permissions } from '../../services/permissions';
import { 
  History, 
  FileSpreadsheet, 
  Search, 
  Download, 
  ShieldAlert, 
  Package, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';
import { Badge, Button, Card, Input, Pagination, Select, Table, TableToolbar, TBody, Td, Th, THead, Tr } from '../../components/ui';

const ITEMS_PER_PAGE = 10;

export const AdminImportHistory: React.FC = () => {
  const { user } = useAuth();
  const canView = permissions.canViewAuditLogs(user);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const jobs = useMemo(() => {
    return localDb.getImportJobs({
      searchTerm,
      import_type: typeFilter,
      status: statusFilter,
    });
  }, [searchTerm, typeFilter, statusFilter]);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return jobs.slice(start, start + ITEMS_PER_PAGE);
  }, [jobs, currentPage]);

  if (!canView) {
    return (
      <Card className="p-8 text-center border-amber-200 bg-amber-50">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
          Only System Administrators have permission to view import job execution history.
        </p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
          solid: 'bg-emerald-600 text-white',
          dot: 'bg-emerald-500',
          label: 'Completed',
        };
      case 'completed_with_errors':
        return {
          subtle: 'bg-amber-50 text-amber-700 ring-amber-200',
          solid: 'bg-amber-600 text-white',
          dot: 'bg-amber-500',
          label: 'Completed with Errors',
        };
      default:
        return {
          subtle: 'bg-rose-50 text-rose-700 ring-rose-200',
          solid: 'bg-rose-600 text-white',
          dot: 'bg-rose-500',
          label: 'Failed',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <TableToolbar>
        <div className="relative flex-1 max-w-xl">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by file name, import type, strategy, or user..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            <option value="all">All Import Types</option>
            <option value="products">Products</option>
            <option value="customers">Customers</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed Clean</option>
            <option value="completed_with_errors">Completed with Errors</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </TableToolbar>

      {/* History Table */}
      <Card flush>
        {paginatedJobs.length > 0 ? (
          <Table minWidth={1500}>
            <THead>
              <Tr hover={false}>
                <Th width={150}>Date & Time</Th>
                <Th width={120}>Import Type</Th>
                <Th width={200}>File Name</Th>
                <Th width={130}>Strategy</Th>
                <Th width={70}>Total</Th>
                <Th width={80}>Created</Th>
                <Th width={80}>Updated</Th>
                <Th width={80}>Skipped</Th>
                <Th width={80}>Failed</Th>
                <Th width={160}>Status</Th>
                <Th width={160}>User</Th>
                <Th width={130} align="right">Error Log</Th>
              </Tr>
            </THead>
            <TBody>
              {paginatedJobs.map((job) => (
                <Tr key={job.id}>
                  <Td width={150} className="text-xs text-slate-600 font-mono">
                    {formatDate(job.started_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Td>
                  <Td width={120}>
                    <span className="inline-flex items-center gap-1 text-xs font-bold capitalize text-slate-900">
                      {job.import_type === 'products' ? <Package className="w-3.5 h-3.5 text-sky-600" /> : <Users className="w-3.5 h-3.5 text-purple-600" />}
                      {job.import_type}
                    </span>
                  </Td>
                  <Td width={200} truncate maxWidth={200} className="font-mono text-xs font-bold text-slate-900">{job.file_name}</Td>
                  <Td width={130} truncate maxWidth={130} className="text-xs text-slate-600 capitalize">{job.import_strategy.replace(/_/g, ' ')}</Td>
                  <Td width={70} className="text-xs font-bold text-slate-900">{job.total_rows}</Td>
                  <Td width={80} className="text-xs font-bold text-emerald-700">{job.created_count}</Td>
                  <Td width={80} className="text-xs font-bold text-sky-700">{job.updated_count}</Td>
                  <Td width={80} className="text-xs font-bold text-slate-500">{job.skipped_count}</Td>
                  <Td width={80} className="text-xs font-bold text-rose-700">{job.failed_count}</Td>
                  <Td width={160}>
                    <Badge badge={getStatusBadge(job.status)} />
                  </Td>
                  <Td width={160} truncate maxWidth={160} className="text-xs text-slate-600">
                    {job.created_by_profile ? job.created_by_profile.full_name : <span className="text-slate-400 italic">System</span>}
                  </Td>
                  <Td width={130} align="right">
                    {job.errors && job.errors.length > 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadErrorReportCSV(`${job.import_type}_import_errors.csv`, job.errors!)}
                        icon={<Download className="w-3 h-3" />}
                      >
                        Errors ({job.errors.length})
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No errors</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No import history records found.</p>
            <p className="mt-1">Bulk CSV imports performed by Administrators will appear here.</p>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={jobs.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default AdminImportHistory;

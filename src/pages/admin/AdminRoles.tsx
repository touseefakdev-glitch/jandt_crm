import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

export const AdminRoles: React.FC = () => {
  const permissionsMatrix = [
    {
      module: 'Customers Management',
      admin: 'Full (View, Create, Edit, Deactivate)',
      sales: 'Limited (View, Create, Edit)',
      support: 'Limited (View, Create, Edit)',
    },
    {
      module: 'Support Tickets & Queries',
      admin: 'Full (View All, Create, Assign, Reassign, Status, Priority, Internal Notes, Resolve, Close, Reopen)',
      sales: 'Restricted (View Relevant Only)',
      support: 'Full Support (View All, Create, Assign, Status, Priority, Internal Notes, Resolve, Close, Reopen)',
    },
    {
      module: 'Order Fulfillment & Workflow',
      admin: 'Full (View All, Create, Progress Workflow 1-6, Cancel, Upload Docs, Admin Override)',
      sales: 'Full Sales (View All, Create, Progress Workflow 1-6, Cancel, Upload Docs)',
      support: 'View Only (View Orders & Status Context)',
    },
    {
      module: 'Products Catalog',
      admin: 'Full (View, Create, Edit, Categories, Brands)',
      sales: 'View Only (Search Catalog, View SKU & Details)',
      support: 'View Only (Search Catalog, View SKU & Details)',
    },
    {
      module: 'Product Availability Status',
      admin: 'Full (Change Status, Mark Out of Stock / Resupply)',
      sales: 'View Only (Out-of-Stock Warning Alerts)',
      support: 'View Only (Out-of-Stock Warning Alerts)',
    },
    {
      module: 'Notifications & Alerts',
      admin: 'Full System & User Notifications',
      sales: 'User Specific Notifications',
      support: 'User Specific Notifications',
    },
    {
      module: 'Shift Handover & Operations',
      admin: 'Full (Create, Submit, Acknowledge, Complete Items, Configure Shifts)',
      sales: 'Relevant (Create, Submit, Add Order Items, Acknowledge)',
      support: 'Relevant (Create, Submit, Add Query Items, Acknowledge, Complete Items)',
    },
    {
      module: 'User Roster Management',
      admin: 'Full (Create User, Edit, Activate, Deactivate, Reassign Active Work)',
      sales: 'Access Restricted',
      support: 'Access Restricted',
    },
    {
      module: 'Operational Teams Management',
      admin: 'Full (Create Team, Edit Team, Shift Info, Team Roster)',
      sales: 'Access Restricted',
      support: 'Access Restricted',
    },
    {
      module: 'CRM System Settings',
      admin: 'Full (Company Name, CRM Title, Timezone, Currency, Pagination)',
      sales: 'Access Restricted',
      support: 'Access Restricted',
    },
    {
      module: 'Immutable Audit Logs',
      admin: 'Full (View, Multi-field Search, Filter by User/Action/Entity)',
      sales: 'Access Restricted',
      support: 'Access Restricted',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Permissions Architecture Matrix"
        description="Centralized authorization rules enforced across frontend navigation, routes, and backend data services"
        icon={<ShieldAlert className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        badges={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-xl border border-purple-200">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            Backend RBAC Enforced
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-purple-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm uppercase tracking-wider text-purple-300">System Admin</span>
            <ShieldCheck className="w-5 h-5 text-purple-300" />
          </div>
          <p className="text-xs text-purple-100 leading-relaxed">
            Full system control across users, teams, roles, orders, queries, products, availability, settings, shift config, and immutable audit logs.
          </p>
        </div>

        <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm uppercase tracking-wider text-emerald-300">Sales Agent</span>
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Primary sales workspace for customer management, order fulfillment workflows 1-6, catalog searching, out-of-stock alerts, and shift handovers.
          </p>
        </div>

        <div className="bg-amber-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm uppercase tracking-wider text-amber-300">Support Agent</span>
            <ShieldCheck className="w-5 h-5 text-amber-300" />
          </div>
          <p className="text-xs text-amber-100 leading-relaxed">
            Full support workspace for managing customer queries, confidential internal notes, resolving/reopening tickets, order viewing, and handover item completion.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Module Access Control Matrix"
          subtitle={<span className="font-mono">11 System Modules</span>}
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <CardBody className="p-0">
          <Table wrapperClassName="rounded-b-xl">
            <THead>
              <Tr hover={false}>
                <Th>Module / Feature Area</Th>
                <Th className="bg-purple-50/50 text-purple-900 font-bold">Admin Role</Th>
                <Th className="bg-emerald-50/50 text-emerald-900 font-bold">Sales Agent Role</Th>
                <Th className="bg-amber-50/50 text-amber-900 font-bold">Support Agent Role</Th>
              </Tr>
            </THead>
            <TBody>
              {permissionsMatrix.map((row, idx) => (
                <Tr key={idx}>
                  <Td className="font-bold text-slate-900">{row.module}</Td>
                  <Td className="bg-purple-50/20 text-purple-950 font-semibold">{row.admin}</Td>
                  <Td className="bg-emerald-50/20 text-emerald-950 font-medium">
                    {row.sales.includes('Restricted') ? <span className="text-red-700 font-bold">{row.sales}</span> : row.sales}
                  </Td>
                  <Td className="bg-amber-50/20 text-amber-950 font-medium">
                    {row.support.includes('Restricted') ? <span className="text-red-700 font-bold">{row.support}</span> : row.support}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

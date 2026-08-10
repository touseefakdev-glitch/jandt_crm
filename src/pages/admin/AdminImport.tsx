import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ImportType, 
  ImportStrategy, 
  ImportJob, 
  ImportErrorItem, 
  ImportDuplicateItem 
} from '../../types';
import { permissions } from '../../services/permissions';
import { 
  parseAndValidateCSV, 
  executeImport, 
  downloadProductsTemplate, 
  downloadCustomersTemplate,
  downloadErrorReportCSV,
  CSVParseResult
} from '../../utils/csvImporter';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  Package, 
  Users, 
  ShieldAlert, 
  Info,
  Layers,
  ArrowLeft,
  FileSpreadsheet
} from 'lucide-react';
import { Badge, Button, Card, CardBody, Modal, Table, TBody, Td, Th, THead, Tr, useToast } from '../../components/ui';

type Step = 'select_type' | 'upload' | 'preview' | 'confirm' | 'results';

export const AdminImport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const canImport = permissions.canPerformImport(user).allowed;

  const [currentStep, setCurrentStep] = useState<Step>('select_type');
  const [searchParams] = useSearchParams();
  const requestedType: ImportType = searchParams.get('type') === 'customers' ? 'customers' : 'products';
  const [importType, setImportType] = useState<ImportType>(requestedType);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('create_new_only');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'valid' | 'errors' | 'duplicates'>('valid');

  const [isImporting, setIsImporting] = useState(false);
  const [completedJob, setCompletedJob] = useState<ImportJob | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    if (currentStep === 'select_type' && searchParams.get('type')) {
      setCurrentStep('upload');
    }
  }, []);

  if (!canImport) {
    return (
      <Card className="p-8 text-center border-amber-200 bg-amber-50">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
          Only System Administrators have permission to perform bulk CSV data imports into the CRM.
        </p>
      </Card>
    );
  }

  const handleSelectType = (type: ImportType) => {
    setImportType(type);
    setSelectedFile(null);
    setParseResult(null);
    setParseError(null);
    setCurrentStep('upload');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      const result = await parseAndValidateCSV(file, importType);
      setParseResult(result);
      if (result.errors.length > 0) {
        setActivePreviewTab('errors');
      } else if (result.duplicates.length > 0 && importType === 'customers') {
        setActivePreviewTab('duplicates');
      } else {
        setActivePreviewTab('valid');
      }
      setCurrentStep('preview');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file.');
      toast({ type: 'error', title: 'Upload Failed', message: err.message || 'Invalid CSV file format.' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (!user || !parseResult || !selectedFile) return;

    setIsImporting(true);
    setIsConfirmModalOpen(false);

    try {
      const job = executeImport({
        importType,
        importStrategy,
        fileName: selectedFile.name,
        validRows: parseResult.validRows,
        errors: parseResult.errors,
        duplicates: parseResult.duplicates,
        userId: user.id,
      });

      setCompletedJob(job);
      setCurrentStep('results');

      toast({
        type: job.status === 'completed' ? 'success' : 'info',
        title: 'Import Processed',
        message: `Successfully processed ${job.total_rows} rows. Created: ${job.created_count}, Updated: ${job.updated_count}, Skipped: ${job.skipped_count}.`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Import Failed', message: err.message || 'An unexpected error occurred during database import.' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('select_type');
    setSelectedFile(null);
    setParseResult(null);
    setCompletedJob(null);
    setParseError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <Card className="p-4 border-l-4 border-l-sky-500 bg-sky-50/50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">J&T Supplies Bulk Data Import Engine</p>
            <p>
              Upload UTF-8 formatted CSV files to import Products catalog or Customer contacts. 
              <span className="font-semibold text-slate-900"> NO INVENTORY TRACKING:</span> Product import manages display names, categories, SKUs, and availability status (<span className="font-semibold">Available</span> / <span className="font-semibold">Out of Stock</span>) only. Stock quantities are neither imported nor maintained.
            </p>
          </div>
        </div>
      </Card>

      {/* Stepper Header */}
      <div className="bg-white rounded-[12px] border border-[#D9E2EC] p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto text-xs">
          <div className={`flex items-center space-x-2 ${currentStep === 'select_type' ? 'text-teal-700 font-extrabold' : 'text-[#52606D]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 'select_type' ? 'bg-teal-500 text-white' : 'bg-[#E9EFF5] text-[#52606D]'}`}>1</span>
            <span>Select Type</span>
          </div>
          <div className="w-8 h-px bg-[#D9E2EC]" />
          <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-teal-700 font-extrabold' : 'text-[#52606D]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 'upload' ? 'bg-teal-500 text-white' : 'bg-[#E9EFF5] text-[#52606D]'}`}>2</span>
            <span>Upload CSV</span>
          </div>
          <div className="w-8 h-px bg-[#D9E2EC]" />
          <div className={`flex items-center space-x-2 ${currentStep === 'preview' ? 'text-teal-700 font-extrabold' : 'text-[#52606D]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 'preview' ? 'bg-teal-500 text-white' : 'bg-[#E9EFF5] text-[#52606D]'}`}>3</span>
            <span>Validate & Preview</span>
          </div>
          <div className="w-8 h-px bg-[#D9E2EC]" />
          <div className={`flex items-center space-x-2 ${currentStep === 'results' ? 'text-green-700 font-extrabold' : 'text-[#52606D]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 'results' ? 'bg-green-500 text-white' : 'bg-[#E9EFF5] text-[#52606D]'}`}>4</span>
            <span>Results</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Select Type & Strategy */}
      {currentStep === 'select_type' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products Card */}
            <Card className="p-6 border-2 hover:border-brand-500 transition-all cursor-pointer group" onClick={() => handleSelectType('products')}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadProductsTemplate(); }} icon={<Download className="w-3.5 h-3.5" />}>
                  Template CSV
                </Button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-brand-600 transition-colors">Import Products</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload product catalog entries with SKUs, categories, and availability status (<span className="font-mono">Available</span>, <span className="font-mono">Out of Stock</span>).
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                <span>Headers: product_name, category, sku, availability</span>
                <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Customers Card */}
            <Card className="p-6 border-2 hover:border-brand-500 transition-all cursor-pointer group" onClick={() => handleSelectType('customers')}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadCustomersTemplate(); }} icon={<Download className="w-3.5 h-3.5" />}>
                  Template CSV
                </Button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-brand-600 transition-colors">Import Customers</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload commercial customer accounts with telephone, WhatsApp numbers (stored as strings), cities, and routes.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                <span>Headers: customer_name, whatsapp_number, phone_number, city, route</span>
                <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              Default Import Strategy Selection
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${importStrategy === 'create_new_only' ? 'border-brand-600 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="strategy"
                  value="create_new_only"
                  checked={importStrategy === 'create_new_only'}
                  onChange={() => setImportStrategy('create_new_only')}
                  className="sr-only"
                />
                <span className="font-bold text-slate-900 block">1. Create New Only (Recommended)</span>
                <span className="text-slate-500 block mt-1">Safest option. Only creates records whose SKU/Contact does not already exist in the database.</span>
              </label>

              <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${importStrategy === 'update_existing' ? 'border-brand-600 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="strategy"
                  value="update_existing"
                  checked={importStrategy === 'update_existing'}
                  onChange={() => setImportStrategy('update_existing')}
                  className="sr-only"
                />
                <span className="font-bold text-slate-900 block">2. Update Existing</span>
                <span className="text-slate-500 block mt-1">If SKU or customer matches, overwrites existing details with imported values.</span>
              </label>

              <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${importStrategy === 'skip_existing' ? 'border-brand-600 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="strategy"
                  value="skip_existing"
                  checked={importStrategy === 'skip_existing'}
                  onChange={() => setImportStrategy('skip_existing')}
                  className="sr-only"
                />
                <span className="font-bold text-slate-900 block">3. Skip Existing</span>
                <span className="text-slate-500 block mt-1">Leaves existing matching records completely untouched and imports only new ones.</span>
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 2: Upload CSV */}
      {currentStep === 'upload' && (
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentStep('select_type')} className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Selection
            </button>
            <Button size="sm" variant="outline" onClick={importType === 'products' ? downloadProductsTemplate : downloadCustomersTemplate} icon={<Download className="w-3.5 h-3.5" />}>
              Download {importType === 'products' ? 'Products' : 'Customers'} Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-10 text-center transition-all bg-slate-50/50 hover:bg-white relative">
            <input
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFileChange}
              disabled={isParsing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {isParsing ? <RefreshCw className="w-8 h-8 animate-spin text-brand-600" /> : <Upload className="w-8 h-8" />}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isParsing ? 'Parsing & Validating CSV File...' : `Choose or Drag & Drop ${importType === 'products' ? 'Product' : 'Customer'} CSV File`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports standard UTF-8 CSV files with header row (Max 5MB file size limit).
            </p>
            {parseError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg inline-flex items-center gap-2 font-medium">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-200">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">Expected CSV Header Format</span>
            {importType === 'products' ? (
              <code className="block p-2 bg-white rounded border border-slate-200 text-slate-800 font-mono">
                product_name,category,sku,availability
              </code>
            ) : (
              <code className="block p-2 bg-white rounded border border-slate-200 text-slate-800 font-mono">
                customer_name,whatsapp_number,phone_number,city,route
              </code>
            )}
          </div>
        </Card>
      )}

      {/* STEP 3: Preview & Validation */}
      {currentStep === 'preview' && parseResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Rows</span>
              <span className="text-2xl font-black text-slate-900 block mt-1">{parseResult.totalRows}</span>
            </Card>
            <Card className="p-4 bg-emerald-50/50 border-emerald-200">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Valid Records</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">{parseResult.validRows.length}</span>
            </Card>
            <Card className={`p-4 ${parseResult.errors.length > 0 ? 'bg-rose-50/50 border-rose-200' : ''}`}>
              <span className={`text-xs uppercase font-semibold ${parseResult.errors.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>Validation Errors</span>
              <span className={`text-2xl font-black block mt-1 ${parseResult.errors.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>{parseResult.errors.length}</span>
            </Card>
            <Card className={`p-4 ${parseResult.duplicates.length > 0 ? 'bg-amber-50/50 border-amber-200' : ''}`}>
              <span className={`text-xs uppercase font-semibold ${parseResult.duplicates.length > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Duplicates / Matches</span>
              <span className={`text-2xl font-black block mt-1 ${parseResult.duplicates.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{parseResult.duplicates.length}</span>
            </Card>
          </div>

          {/* Strategy Bar */}
          <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white">
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block font-medium">Selected Import Strategy</span>
                <span className="text-sm font-bold capitalize text-white">{importStrategy.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={importStrategy}
                onChange={(e) => setImportStrategy(e.target.value as ImportStrategy)}
                className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 font-semibold focus:outline-none"
              >
                <option value="create_new_only">Create New Only (Safest)</option>
                <option value="update_existing">Update Existing Records</option>
                <option value="skip_existing">Skip Existing Records</option>
              </select>
            </div>
          </Card>

          {/* Preview Navigation Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
            <div className="flex items-center border-b border-slate-200 px-4 pt-3 bg-slate-50/50">
              <button
                onClick={() => setActivePreviewTab('valid')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activePreviewTab === 'valid' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Valid Records ({parseResult.validRows.length})</span>
              </button>

              {parseResult.errors.length > 0 && (
                <button
                  onClick={() => setActivePreviewTab('errors')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activePreviewTab === 'errors' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Validation Errors ({parseResult.errors.length})</span>
                </button>
              )}

              {parseResult.duplicates.length > 0 && (
                <button
                  onClick={() => setActivePreviewTab('duplicates')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activePreviewTab === 'duplicates' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Duplicates / Matches ({parseResult.duplicates.length})</span>
                </button>
              )}
            </div>

            {/* Valid Rows Tab */}
            {activePreviewTab === 'valid' && (
              <div className="p-4">
                {parseResult.validRows.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                    <Table>
                      <THead>
                        <Tr hover={false}>
                          <Th>#</Th>
                          {importType === 'products' ? (
                            <>
                              <Th>Product Name</Th>
                              <Th>Category</Th>
                              <Th>SKU</Th>
                              <Th>Availability Status</Th>
                            </>
                          ) : (
                            <>
                              <Th>Customer Name</Th>
                              <Th>WhatsApp</Th>
                              <Th>Phone</Th>
                              <Th>City</Th>
                              <Th>Route</Th>
                            </>
                          )}
                        </Tr>
                      </THead>
                      <TBody>
                        {parseResult.validRows.map((row, i) => (
                          <Tr key={i}>
                            <Td className="text-xs font-mono text-slate-400">{i + 1}</Td>
                            {importType === 'products' ? (
                              <>
                                <Td className="font-semibold text-slate-900">{row.product_name}</Td>
                                <Td className="text-xs text-slate-600">{row.category || '—'}</Td>
                                <Td className="font-mono text-xs font-bold text-brand-700">{row.sku}</Td>
                                <Td>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                    row.availability === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {row.availability}
                                  </span>
                                </Td>
                              </>
                            ) : (
                              <>
                                <Td className="font-semibold text-slate-900">{row.customer_name}</Td>
                                <Td className="font-mono text-xs text-slate-600">{row.whatsapp_number || '—'}</Td>
                                <Td className="font-mono text-xs text-slate-600">{row.phone_number || '—'}</Td>
                                <Td className="text-xs text-slate-600">{row.city || '—'}</Td>
                                <Td className="text-xs text-slate-600">{row.route || '—'}</Td>
                              </>
                            )}
                          </Tr>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No valid rows to preview.</p>
                )}
              </div>
            )}

            {/* Errors Tab */}
            {activePreviewTab === 'errors' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Row-level errors will be skipped during import.</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadErrorReportCSV(`${importType}_import_errors.csv`, parseResult.errors)}
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Error Report CSV
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto border border-rose-200 rounded-lg">
                  <Table>
                    <THead>
                      <Tr hover={false} className="bg-rose-50">
                        <Th className="text-rose-900">Row #</Th>
                        <Th className="text-rose-900">Error Reason</Th>
                        <Th className="text-rose-900">Row Data Snippet</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {parseResult.errors.map((err, i) => (
                        <Tr key={i} className="hover:bg-rose-50/50">
                          <Td className="font-mono text-xs font-bold text-rose-700">{err.row}</Td>
                          <Td className="text-xs font-bold text-rose-800">{err.error}</Td>
                          <Td className="font-mono text-[11px] text-slate-600 truncate max-w-xs">{JSON.stringify(err.data)}</Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Duplicates Tab */}
            {activePreviewTab === 'duplicates' && (
              <div className="p-4 space-y-4">
                <span className="text-xs text-slate-600 font-medium block">
                  Identified potential matches in existing catalog. Action depends on your selected strategy:
                </span>
                <div className="max-h-96 overflow-y-auto border border-amber-200 rounded-lg">
                  <Table>
                    <THead>
                      <Tr hover={false} className="bg-amber-50">
                        <Th className="text-amber-900">Row #</Th>
                        <Th className="text-amber-900">Imported Item</Th>
                        <Th className="text-amber-900">Existing Match</Th>
                        <Th className="text-amber-900">Match Reason</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {parseResult.duplicates.map((dup, i) => (
                        <Tr key={i} className="hover:bg-amber-50/50">
                          <Td className="font-mono text-xs font-bold text-amber-700">{dup.row}</Td>
                          <Td className="text-xs font-bold text-slate-900">
                            {dup.data.product_name || dup.data.customer_name}
                          </Td>
                          <Td className="text-xs font-semibold text-slate-900">
                            {dup.existing_name} <span className="font-mono text-slate-500">({dup.existing_identifier})</span>
                          </Td>
                          <Td className="text-xs text-amber-800">{dup.reason}</Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={handleReset}>
              Cancel & Start Over
            </Button>
            <div className="flex items-center gap-3">
              {parseResult.errors.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => downloadErrorReportCSV(`${importType}_import_errors.csv`, parseResult.errors)}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download Errors CSV
                </Button>
              )}
              <Button
                disabled={parseResult.validRows.length === 0}
                onClick={() => setIsConfirmModalOpen(true)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Import {parseResult.validRows.length} Valid Records
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Confirm ${importType === 'products' ? 'Product' : 'Customer'} Import`}
        subtitle="Review final import numbers before committing changes to database"
        icon={
          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200 font-semibold">
              <span>File Name:</span>
              <span className="font-mono text-slate-900">{selectedFile?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 font-semibold">
              <span>Import Strategy:</span>
              <span className="capitalize text-brand-600">{importStrategy.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Total Valid Rows to Process:</span>
              <span className="font-bold text-slate-900">{parseResult?.validRows.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 text-rose-600 font-medium">
              <span>Failed / Invalid Rows Skipped:</span>
              <span>{parseResult?.errors.length}</span>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Only valid rows will be committed. Database changes cannot be automatically undone. Are you sure you wish to proceed?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isImporting}
              loading={isImporting}
              onClick={handleExecuteImport}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Execute Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* STEP 5: Results Screen */}
      {currentStep === 'results' && completedJob && (
        <Card className="p-8 space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">IMPORT COMPLETE</h2>
            <p className="text-xs text-slate-500 mt-1">
              File: <span className="font-mono font-bold text-slate-800">{completedJob.file_name}</span> | Strategy: <span className="capitalize font-semibold text-brand-600">{completedJob.import_strategy.replace(/_/g, ' ')}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Processed</span>
              <span className="text-xl font-bold text-slate-900 mt-0.5 block">{completedJob.total_rows}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Created New</span>
              <span className="text-xl font-bold text-emerald-800 mt-0.5 block">{completedJob.created_count}</span>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
              <span className="text-[10px] text-sky-700 uppercase font-semibold block">Updated</span>
              <span className="text-xl font-bold text-sky-800 mt-0.5 block">{completedJob.updated_count}</span>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Skipped</span>
              <span className="text-xl font-bold text-slate-700 mt-0.5 block">{completedJob.skipped_count}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-700 uppercase font-semibold block">Failed / Errors</span>
              <span className="text-xl font-bold text-rose-800 mt-0.5 block">{completedJob.failed_count}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navigate(importType === 'products' ? '/products' : '/customers')}
              icon={<Package className="w-4 h-4" />}
            >
              View {importType === 'products' ? 'Products Catalog' : 'Customer Directory'}
            </Button>

            {completedJob.errors && completedJob.errors.length > 0 && (
              <Button
                variant="outline"
                onClick={() => downloadErrorReportCSV(`${importType}_import_errors.csv`, completedJob.errors!)}
                icon={<Download className="w-4 h-4" />}
              >
                Download Error Report
              </Button>
            )}

            <Button variant="outline" onClick={() => navigate('/admin/import/history')}>
              View Import History
            </Button>

            <Button variant="secondary" onClick={handleReset} icon={<RefreshCw className="w-4 h-4" />}>
              Import Another File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminImport;

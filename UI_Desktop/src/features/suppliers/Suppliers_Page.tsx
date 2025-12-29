/** Suppliers_Page.tsx - Quản lý nhà cung cấp */

import { useEffect, useState } from 'react';
import { apiGetSuppliers, apiCreateSupplier, apiGetSupplierTransactions, Supplier, SupplierTransactions } from '../../app/api_client';
import { useUIStore } from '../../state/ui_store';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import { showToast } from '../../utils/toast';
interface SupplierForm {
  name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  bank_account: string;
  bank_name: string;
  notes: string;
}

export default function Suppliers_Page() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierForm>({
    name: '',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    bank_account: '',
    bank_name: '',
    notes: '',
  });
  
  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransactions | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'transactions'>('info');

  useEffect(() => {
    loadSuppliers();
  }, []);
  
  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await apiGetSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Load suppliers error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      tax_id: '',
      address: '',
      phone: '',
      email: '',
      bank_account: '',
      bank_name: '',
      notes: '',
    });
    setEditingSupplier(null);
  };
  
  const handleOpenAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };
  
  const handleOpenEditModal = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      tax_id: supplier.tax_id,
      address: supplier.address,
      phone: supplier.phone,
      email: supplier.email,
      bank_account: supplier.bank_account,
      bank_name: supplier.bank_name,
      notes: supplier.notes,
    });
    setEditingSupplier(supplier);
    setShowFormModal(true);
  };
  
  const handleFormChange = (field: keyof SupplierForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast.warning('Vui lòng nhập tên nhà cung cấp!');
      return;
    }
    
    try {
      if (editingSupplier) {
        // TODO: Call API update
        showToast.info('Chức năng cập nhật đang phát triển');
      } else {
        const newSupplier = await apiCreateSupplier(formData);
        setSuppliers([...suppliers, newSupplier]);
        showToast.success('Đã thêm nhà cung cấp thành công!');
      }
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      console.error('Submit supplier error:', error);
      showToast.error('Không thể lưu nhà cung cấp!');
    }
  };
  
  const handleViewDetail = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
    setActiveTab('info');
    setSupplierTransactions(null);
    
    // Load transaction history
    setLoadingTransactions(true);
    try {
      const transactions = await apiGetSupplierTransactions(Number(supplier.id));
      setSupplierTransactions(transactions);
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  const handleDelete = (_id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) return;
    // TODO: Call API delete
    showToast.info('Chức năng xóa đang phát triển');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Nhà cung cấp</h1>
          <p className="text-[var(--text-3)] text-sm mt-1">Quản lý thông tin nhà cung cấp</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="h-11 px-6 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white font-semibold transition-all duration-[180ms] hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
        >
          <Icon name="plus" size="sm" />
          Thêm NCC
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-[var(--surface-1)] rounded-[var(--radius-xl)] border border-[var(--border)]">
        <table className="min-w-full">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Tên NCC</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Mã số thuế</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Điện thoại</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Địa chỉ</th>
              <th className="px-4 py-3 text-right text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Công nợ</th>
              <th className="px-4 py-3 text-center text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[var(--text-3)]">
                    <Icon name="spinner" size="md" spin />
                    <span>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-3)]">
                  <Icon name="box-open" size="2x" className="mx-auto mb-3 opacity-50" />
                  <p>Chưa có nhà cung cấp nào</p>
                </td>
              </tr>
            ) : (
              suppliers.map(sup => (
                <tr 
                  key={sup.id} 
                  className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(sup)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-[var(--text-1)]">{sup.name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-2)] text-[13px]">{sup.tax_id || '-'}</td>
                  <td className="px-4 py-3.5 text-[var(--text-2)] text-[13px]">{sup.phone || '-'}</td>
                  <td className="px-4 py-3.5 text-[var(--text-2)] text-[13px]">{sup.address || '-'}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`font-semibold ${sup.outstanding_debt > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                      {sup.outstanding_debt.toLocaleString('vi-VN')} ₫
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenEditModal(sup)}
                        className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors"
                        >
                        <Icon name="pen" size="sm" />
                        </button>
                      <button 
                        onClick={() => handleDelete(sup.id)}
                        className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-[13px] font-medium border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider">Thông tin cơ bản</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Công ty TNHH ABC"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mã số thuế</label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => handleFormChange('tax_id', e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="contact@abc.com"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  placeholder="123 Đường ABC, Quận X, TP.HCM"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Thông tin ngân hàng */}
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider">Thông tin ngân hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Số tài khoản</label>
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={(e) => handleFormChange('bank_account', e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tên ngân hàng</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleFormChange('bank_name', e.target.value)}
                  placeholder="Ngân hàng Vietcombank"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Ghi chú */}
          <div className="pt-4 border-t border-[var(--border)]">
            <label className="block text-sm font-medium mb-1.5">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Ghi chú thêm về nhà cung cấp..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none resize-none"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowFormModal(false);
                resetForm();
              }}
              className="flex-1 h-10 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-10 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Detail Modal - Chi tiết đầy đủ với lịch sử giao dịch */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết nhà cung cấp: ${selectedSupplier?.name || ''}`}
        size="xl"
      >
        {selectedSupplier && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-[var(--border)]">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'info'
                    ? 'text-[var(--primary)] border-[var(--primary)]'
                    : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]'
                }`}
              >
                <Icon name="info" size="sm" className="inline mr-2" />
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'transactions'
                    ? 'text-[var(--primary)] border-[var(--primary)]'
                    : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]'
                }`}
              >
                <Icon name="history" size="sm" className="inline mr-2" />
                Lịch sử giao dịch
                {supplierTransactions && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[12px]">
                    {supplierTransactions.total_transactions}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' ? (
              <div className="space-y-5">
                {/* Outstanding Debt Badge */}
                <div className={`p-4 rounded-[var(--radius-lg)] border-2 ${
                  selectedSupplier.outstanding_debt > 0
                    ? 'bg-[var(--warning-light)] border-[var(--warning)]'
                    : 'bg-[var(--success-light)] border-[var(--success)]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-[var(--text-2)]">CÔNG NỢ HIỆN TẠI</p>
                      <p className={`text-[24px] font-bold ${
                        selectedSupplier.outstanding_debt > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'
                      }`}>
                        {selectedSupplier.outstanding_debt.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    {selectedSupplier.outstanding_debt > 0 ? (
                      <Icon name="danger" size="2x" className="text-[var(--warning)]" />
                    ) : (
                      <Icon name="check-circle" size="2x" className="text-[var(--success)]" />
                    )}
                  </div>
                </div>

                {/* Thông tin cơ bản */}
                <div className="space-y-3">
                  <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Tên nhà cung cấp</p>
                      <p className="text-[15px] font-semibold text-[var(--text-1)]">{selectedSupplier.name}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Mã số thuế</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedSupplier.tax_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Số điện thoại</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedSupplier.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Email</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedSupplier.email || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[12px] text-[var(--text-3)]">Địa chỉ</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedSupplier.address || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Thông tin ngân hàng */}
                <div className="space-y-3">
                  <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Thông tin ngân hàng</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Số tài khoản</p>
                      <p className="text-[15px] font-mono font-medium text-[var(--text-1)]">{selectedSupplier.bank_account || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Tên ngân hàng</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedSupplier.bank_name || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                {selectedSupplier.notes && (
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Ghi chú</h3>
                    <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                      <p className="text-[14px] text-[var(--text-1)] whitespace-pre-wrap">{selectedSupplier.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Transaction Summary */}
                {supplierTransactions && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                      <p className="text-[12px] text-[var(--text-3)]">Tổng giao dịch</p>
                      <p className="text-[20px] font-bold text-[var(--primary)]">{supplierTransactions.total_transactions}</p>
                    </div>
                    <div className="p-4 bg-[var(--success-light)] rounded-[var(--radius-lg)] border border-[var(--success)]/20">
                      <p className="text-[12px] text-[var(--success)]">Phiếu nhập kho</p>
                      <p className="text-[20px] font-bold text-[var(--success)]">{supplierTransactions.stock_in.length}</p>
                    </div>
                    <div className="p-4 bg-[var(--warning-light)] rounded-[var(--radius-lg)] border border-[var(--warning)]/20">
                      <p className="text-[12px] text-[var(--warning)]">Phiếu xuất kho</p>
                      <p className="text-[20px] font-bold text-[var(--warning)]">{supplierTransactions.stock_out.length}</p>
                    </div>
                  </div>
                )}

                {/* Transaction List */}
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-12">
                    <Icon name="spinner" size="lg" spin className="text-[var(--text-3)]" />
                    <span className="ml-3 text-[var(--text-3)]">Đang tải lịch sử...</span>
                  </div>
                ) : supplierTransactions && supplierTransactions.total_transactions === 0 ? (
                  <div className="text-center py-12 text-[var(--text-3)]">
                    <Icon name="inbox" size="2x" className="mx-auto mb-3 opacity-50" />
                    <p>Chưa có giao dịch nào với nhà cung cấp này</p>
                  </div>
                ) : supplierTransactions && (
                  <div className="space-y-4">
                    {/* Stock In Records */}
                    {supplierTransactions.stock_in.length > 0 && (
                      <div>
                        <h4 className="text-[13px] font-semibold text-[var(--text-2)] mb-3 uppercase tracking-wider">
                          Phiếu nhập kho ({supplierTransactions.stock_in.length})
                        </h4>
                        <div className="space-y-2">
                          {supplierTransactions.stock_in.map((record) => (
                            <div
                              key={record.id}
                              className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border)] hover:border-[var(--success)] transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="px-2.5 py-1 rounded-[var(--radius-xs)] bg-[var(--success-light)] text-[var(--success)] text-[11px] font-bold">
                                    NHẬP KHO
                                  </span>
                                  <span className="text-[14px] font-mono font-medium text-[var(--primary)]">{record.id}</span>
                                </div>
                                <span className="text-[13px] text-[var(--text-3)]">
                                  {new Date(record.date).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[13px]">
                                <div className="flex items-center gap-4">
                                  <span className="text-[var(--text-2)]">
                                    <span className="font-medium text-[var(--success)]">+{record.total_quantity}</span> sản phẩm
                                  </span>
                                  <span className="text-[var(--text-3)]">•</span>
                                  <span className="font-medium text-[var(--text-1)]">
                                    {record.total_amount.toLocaleString('vi-VN')} ₫
                                  </span>
                                </div>
                                {record.note && (
                                  <span className="text-[var(--text-3)] italic max-w-[200px] truncate">{record.note}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock Out Records */}
                    {supplierTransactions.stock_out.length > 0 && (
                      <div>
                        <h4 className="text-[13px] font-semibold text-[var(--text-2)] mb-3 uppercase tracking-wider">
                          Phiếu xuất kho ({supplierTransactions.stock_out.length})
                        </h4>
                        <div className="space-y-2">
                          {supplierTransactions.stock_out.map((record) => (
                            <div
                              key={record.id}
                              className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border)] hover:border-[var(--warning)] transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="px-2.5 py-1 rounded-[var(--radius-xs)] bg-[var(--warning-light)] text-[var(--warning)] text-[11px] font-bold">
                                    XUẤT KHO
                                  </span>
                                  <span className="text-[14px] font-mono font-medium text-[var(--primary)]">{record.id}</span>
                                </div>
                                <span className="text-[13px] text-[var(--text-3)]">
                                  {new Date(record.date).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[13px]">
                                <div className="flex items-center gap-4">
                                  <span className="text-[var(--text-2)]">
                                    <span className="font-medium text-[var(--warning)]">-{record.total_quantity}</span> sản phẩm
                                  </span>
                                  {record.total_amount && (
                                    <>
                                      <span className="text-[var(--text-3)]">•</span>
                                      <span className="font-medium text-[var(--text-1)]">
                                        {record.total_amount.toLocaleString('vi-VN')} ₫
                                      </span>
                                    </>
                                  )}
                                </div>
                                {record.note && (
                                  <span className="text-[var(--text-3)] italic max-w-[200px] truncate">{record.note}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setShowDetailModal(false)}
                className="h-10 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** Reports_Page.tsx - Báo cáo tổng hợp */

export default function Reports_Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo tổng hợp</h1>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Chọn loại báo cáo:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button className="bg-primary/10 text-primary px-6 py-4 rounded-lg font-bold hover:bg-primary/20">Báo cáo tồn kho</button>
          <button className="bg-success/10 text-success px-6 py-4 rounded-lg font-bold hover:bg-success/20">Báo cáo nhập/xuất</button>
          <button className="bg-warning/10 text-warning px-6 py-4 rounded-lg font-bold hover:bg-warning/20">Báo cáo hàng sắp hết</button>
          <button className="bg-danger/10 text-danger px-6 py-4 rounded-lg font-bold hover:bg-danger/20">Báo cáo hàng lỗi/hủy</button>
        </div>
        <div className="border-t pt-6 text-zinc-500 dark:text-zinc-400">
          Chọn loại báo cáo để xem chi tiết. (Tính năng export/pdf sẽ được cập nhật sau)
        </div>
      </div>
    </div>
  );
}

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportTransactionsPDF(transactions, month) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(45, 106, 79)
  doc.text('FinTrack', 14, 20)

  doc.setFontSize(12)
  doc.setTextColor(100)
  const [year, mo] = month.split('-')
  const monthLabel = new Date(year, mo - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  doc.text(`Laporan Keuangan — ${monthLabel}`, 14, 30)
  doc.text(`Diekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 37)

  // Summary
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text('Ringkasan', 14, 50)

  autoTable(doc, {
    startY: 54,
    head: [['Keterangan', 'Jumlah']],
    body: [
      ['Total Pemasukan', formatRp(totalIncome)],
      ['Total Pengeluaran', formatRp(totalExpense)],
      ['Saldo', formatRp(balance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [45, 106, 79], fontSize: 11 },
    bodyStyles: { fontSize: 11 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Detail Transaksi
  const tableY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.text('Detail Transaksi', 14, tableY)

  const rows = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => [
      t.date,
      t.categories?.name || '-',
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.description || '-',
      (t.type === 'income' ? '+' : '-') + formatRp(t.amount)
    ])

  autoTable(doc, {
    startY: tableY + 4,
    head: [['Tanggal', 'Kategori', 'Tipe', 'Keterangan', 'Jumlah']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [45, 106, 79], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  doc.save(`FinTrack-${month}.pdf`)
}
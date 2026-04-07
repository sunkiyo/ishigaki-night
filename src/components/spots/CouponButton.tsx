'use client'

import { useState } from 'react'

type Coupon = { title: string; description: string; expiry: string }

export default function CouponButton({ coupon, locale }: { coupon: Coupon; locale: string }) {
  const [open, setOpen] = useState(false)
  const lang = locale
  const label = lang === 'ja' ? 'クーポンを使う' : lang === 'zh' ? '使用优惠券' : 'Use Coupon'
  const expiryLabel = lang === 'ja' ? '有効期限' : lang === 'zh' ? '有效期' : 'Valid until'

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-3 border border-green-600/40 text-green-700 text-sm rounded-lg hover:bg-green-50 transition-colors"
      >
        {label}
      </button>
      {open && (
        <div className="mt-3 p-5 bg-green-50 border border-green-200 rounded-xl">
          <p className="font-semibold text-green-700 mb-1">{coupon.title}</p>
          <p className="text-sm text-stone-600 mb-3">{coupon.description}</p>
          <p className="text-xs text-stone-400">{expiryLabel}: {coupon.expiry}</p>
        </div>
      )}
    </div>
  )
}

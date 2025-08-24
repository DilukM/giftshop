import React from 'react'

export default function ProductCard({ product, onEdit, onDelete }) {
  const img =
    product.image_url || product.imageUrl || (product.images && product.images[0]) || (product.image && product.image.url) || null

  return (
    <div className="flex items-center gap-4 p-4 card">
      <div className="w-28 h-20 flex-shrink-0">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover rounded" />
        ) : (
          <div className="w-full h-full bg-neutral-100 rounded flex items-center justify-center text-sm text-neutral-400">No image</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-lg">{product.name}</div>
            <div className="text-sm text-neutral-500 mt-1">{product.slug || ''}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{product.price}</div>
            <div className="text-sm text-neutral-500">Stock: {product.stockCount ?? product.stock ?? 0}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => onEdit && onEdit(product)} className="btn-secondary text-sm">Edit</button>
          <button onClick={() => onDelete && onDelete(product)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
        </div>
      </div>
    </div>
  )
}

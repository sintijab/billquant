import React, { useState } from 'react';

interface ResourceTableRowProps {
  row: any;
  idx: number;
  open: boolean;
  onToggle: () => void;
}

const ResourceTableRow: React.FC<ResourceTableRowProps> = ({ row, idx, open, onToggle }) => {
  const resources = row.resources || [];
  return (
    <>
      <tr className="hover:bg-surface-light transition-colors">
        <td className="px-4 py-4 text-sm text-text-primary">{row.code}</td>
        <td className="px-4 py-4 text-sm text-text-primary">{row.description}</td>
        <td className="px-4 py-4 text-sm text-text-primary">{row.formula}</td>
        <td className="px-4 py-4 text-sm text-text-primary">{row.unit}</td>
        <td className="px-4 py-4 text-sm text-text-primary">{row.quantity}</td>
        <td className="px-4 py-4 text-sm text-text-primary">{row.price}</td>
        <td className="px-4 py-4 text-sm text-text-primary">{row.total}</td>
      </tr>
      {resources.length > 0 && (
        <tr>
          <td colSpan={7} className="p-0">
            <button
              className="w-full text-left text-green-600 hover:bg-gray-100 hover:underline font-semibold py-2 px-4"
              onClick={onToggle}
              aria-expanded={open}
              style={{ fontWeight: 600 }}
            >
              {open ? `Hide resources` : `Show resources (${resources.length})`}
            </button>
            {open && (
              <div className="py-2">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Formula</th>
                      <th>Unit</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res: any, idx: number) => (
                      <tr key={idx}>
                        <td>{res.code}</td>
                        <td>{res.description}</td>
                        <td>{res.formula}</td>
                        <td>{res.unit}</td>
                        <td>{res.quantity}</td>
                        <td>{res.price}</td>
                        <td>{res.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export default ResourceTableRow;

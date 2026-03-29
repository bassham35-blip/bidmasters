import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Package } from "lucide-react";
import { format } from "date-fns";

export default function PrintShippingLabel({ open, onOpenChange, auction, shipment }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${auction?.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; background: white; }
            .label { width: 4in; min-height: 6in; border: 2px solid #000; padding: 0.25in; margin: 0.25in auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 0.15in; margin-bottom: 0.15in; }
            .carrier { font-size: 28px; font-weight: 900; letter-spacing: 2px; }
            .section { margin-bottom: 0.15in; }
            .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555; }
            .section-value { font-size: 13px; font-weight: bold; margin-top: 2px; }
            .section-sub { font-size: 11px; margin-top: 1px; }
            .barcode-area { border: 1px solid #ccc; padding: 0.15in; text-align: center; margin: 0.15in 0; background: #f9f9f9; }
            .tracking { font-size: 16px; font-weight: 900; letter-spacing: 3px; }
            .barcode-bars { font-size: 36px; letter-spacing: -2px; line-height: 1; margin: 4px 0; }
            .divider { border-top: 1px dashed #999; margin: 0.12in 0; }
            .item-row { display: flex; justify-content: space-between; }
            .footer { border-top: 2px solid #000; padding-top: 0.1in; margin-top: 0.1in; font-size: 9px; text-align: center; color: #555; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  if (!auction || !shipment) return null;

  const now = format(new Date(), 'MMM d, yyyy');
  const delivery = shipment.estimated_delivery
    ? format(new Date(shipment.estimated_delivery), 'MMM d, yyyy')
    : 'Standard Delivery';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            Shipping Label Preview
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="bg-white rounded-lg p-4 my-2">
          <div ref={printRef}>
            <div className="label" style={{ width: '100%', border: '2px solid #000', padding: '16px', fontFamily: 'monospace' }}>
              {/* Header */}
              <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px' }}>
                <div className="carrier" style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px' }}>{shipment.carrier}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>SHIPPING LABEL</div>
              </div>

              {/* FROM */}
              <div className="section" style={{ marginBottom: '10px' }}>
                <div className="section-title" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>FROM (SELLER)</div>
                <div className="section-value" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>{auction.seller_name || 'Seller'}</div>
                <div className="section-sub" style={{ fontSize: '11px', color: '#333' }}>{shipment.seller_email}</div>
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

              {/* TO */}
              <div className="section" style={{ marginBottom: '10px' }}>
                <div className="section-title" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>SHIP TO (BUYER)</div>
                <div className="section-value" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>{auction.current_bidder_name || 'Winner'}</div>
                <div className="section-sub" style={{ fontSize: '11px', color: '#333' }}>{auction.current_bidder}</div>
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

              {/* Item */}
              <div className="section" style={{ marginBottom: '10px' }}>
                <div className="section-title" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>ITEM</div>
                <div className="section-value" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>{auction.title}</div>
                <div className="item-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#333' }}>Category: {auction.category}</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>${(auction.current_bid || auction.starting_price || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Tracking Barcode Area */}
              {shipment.tracking_number && (
                <div className="barcode-area" style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', margin: '10px 0', background: '#f9f9f9' }}>
                  <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Tracking Number</div>
                  <div className="barcode-bars" style={{ fontSize: '30px', letterSpacing: '-2px', lineHeight: 1, margin: '4px 0', fontFamily: 'monospace' }}>
                    {'|'.repeat(40)}
                  </div>
                  <div className="tracking" style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '2px' }}>{shipment.tracking_number}</div>
                </div>
              )}

              {/* Dates */}
              <div className="divider" style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555' }}>
                <span>Ship Date: <strong>{now}</strong></span>
                <span>Est. Delivery: <strong>{delivery}</strong></span>
              </div>

              {shipment.notes && (
                <>
                  <div className="divider" style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                  <div style={{ fontSize: '10px', color: '#555' }}>
                    <strong>Notes:</strong> {shipment.notes}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="footer" style={{ borderTop: '2px solid #000', paddingTop: '8px', marginTop: '10px', fontSize: '9px', textAlign: 'center', color: '#555' }}>
                <Package style={{ display: 'inline', width: 12, height: 12, marginRight: 4 }} />
                Auction ID: {auction.id} · Printed {now}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
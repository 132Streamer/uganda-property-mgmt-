import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PaymentReceiptProps {
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  currency: string;
  periodMonth: string;
  periodYear: number;
  transactionId: string;
  paymentDate: string;
}

export const PaymentReceipt = ({
  tenantName = "Alice Nakato",
  propertyName = "Greenview Apartments",
  unitNumber = "A4",
  amount = 850000,
  currency = "UGX",
  periodMonth = "July",
  periodYear = 2025,
  transactionId = "TXN-20250701-8842",
  paymentDate = "1 July 2025",
}: PaymentReceiptProps) => {
  const formattedAmount = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <Html>
      <Head />
      <Preview>
        Payment confirmed — {formattedAmount} for {periodMonth} {periodYear}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>PropertyHub</Text>
            <Text style={headerSub}>Payment Receipt</Text>
          </Section>

          {/* Confirmation Banner */}
          <Section style={banner}>
            <Text style={bannerIcon}>✓</Text>
            <Text style={bannerText}>Your rent is paid</Text>
            <Text style={bannerAmount}>{formattedAmount}</Text>
          </Section>

          {/* Period */}
          <Section style={periodSection}>
            <Text style={periodLabel}>
              Rent for {periodMonth} {periodYear}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Receipt Details */}
          <Section style={detailsSection}>
            <Text style={sectionLabel}>Receipt Details</Text>

            <Row style={detailRow}>
              <Column style={detailKey}>Tenant</Column>
              <Column style={detailValue}>{tenantName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Property</Column>
              <Column style={detailValue}>{propertyName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Unit</Column>
              <Column style={detailValue}>Unit {unitNumber}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Rental Period</Column>
              <Column style={detailValue}>
                {periodMonth} {periodYear}
              </Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Payment Date</Column>
              <Column style={detailValue}>{paymentDate}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Transaction ID</Column>
              <Column style={{ ...detailValue, fontFamily: "monospace", fontSize: "13px" }}>
                {transactionId}
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Total Row */}
          <Section style={totalSection}>
            <Row>
              <Column style={totalLabel}>Amount Paid</Column>
              <Column style={totalValue}>{formattedAmount}</Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section>
            <Text style={footer}>
              Keep this receipt for your records. For disputes, contact{" "}
              <a href="mailto:support@propertyhub.ug" style={link}>
                support@propertyhub.ug
              </a>{" "}
              with your transaction ID.
            </Text>
            <Text style={footer}>
              © {new Date().getFullYear()} PropertyHub Uganda
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReceipt;

// ─── Styles ────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "8px",
  maxWidth: "560px",
  overflow: "hidden",
  border: "1px solid #e4e4e7",
};

const header: React.CSSProperties = {
  backgroundColor: "#16a34a",
  padding: "20px 32px 16px",
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "800",
  margin: "0 0 2px",
  letterSpacing: "-0.5px",
};

const headerSub: React.CSSProperties = {
  color: "#bbf7d0",
  fontSize: "12px",
  fontWeight: "500",
  margin: "0",
  letterSpacing: "1px",
  textTransform: "uppercase",
};

const banner: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  padding: "28px 32px",
  textAlign: "center",
  borderBottom: "1px solid #dcfce7",
};

const bannerIcon: React.CSSProperties = {
  backgroundColor: "#16a34a",
  borderRadius: "50%",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "18px",
  fontWeight: "700",
  height: "36px",
  lineHeight: "36px",
  margin: "0 auto 8px",
  width: "36px",
  textAlign: "center",
};

const bannerText: React.CSSProperties = {
  color: "#15803d",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const bannerAmount: React.CSSProperties = {
  color: "#18181b",
  fontSize: "32px",
  fontWeight: "800",
  margin: "0",
  letterSpacing: "-1px",
};

const periodSection: React.CSSProperties = {
  padding: "16px 32px 0",
};

const periodLabel: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: "0",
  textAlign: "center",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0",
};

const detailsSection: React.CSSProperties = {
  padding: "24px 32px",
};

const sectionLabel: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  textTransform: "uppercase",
  margin: "0 0 16px",
};

const detailRow: React.CSSProperties = {
  marginBottom: "10px",
};

const detailKey: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  width: "40%",
};

const detailValue: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
};

const totalSection: React.CSSProperties = {
  padding: "18px 32px",
  backgroundColor: "#fafafa",
};

const totalLabel: React.CSSProperties = {
  color: "#18181b",
  fontSize: "15px",
  fontWeight: "700",
};

const totalValue: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "18px",
  fontWeight: "800",
  textAlign: "right",
};

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  padding: "0 32px",
  textAlign: "center",
  lineHeight: "1.6",
  marginBottom: "8px",
};

const link: React.CSSProperties = {
  color: "#16a34a",
  textDecoration: "underline",
};
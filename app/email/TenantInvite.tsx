import {
  Body,
  Button,
  Container,
  Column,
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

interface TenantInviteProps {
  landlordName: string;
  tenantEmail: string;
  propertyName: string;
  unitNumber: string;
  monthlyRent: number;
  inviteLink: string;
}

export const TenantInvite = ({
  landlordName = "John Doe",
  tenantEmail = "tenant@example.com",
  propertyName = "Greenview Apartments",
  unitNumber = "A4",
  monthlyRent = 850000,
  inviteLink = "https://propertyhub.ug/invite/abc123",
}: TenantInviteProps) => {
  const formattedRent = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(monthlyRent);

  return (
    <Html>
      <Head />
      <Preview>
        {landlordName} invited you to join {propertyName} on PropertyHub
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>PropertyHub</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Heading style={h1}>You've been invited!</Heading>
            <Text style={subtext}>
              <strong>{landlordName}</strong> has invited you to manage your
              tenancy for <strong>{propertyName}</strong> through PropertyHub.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Property Details */}
          <Section style={detailsSection}>
            <Text style={sectionLabel}>Property Details</Text>
            <Row style={detailRow}>
              <Column style={detailKey}>Property</Column>
              <Column style={detailValue}>{propertyName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Unit</Column>
              <Column style={detailValue}>Unit {unitNumber}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Tenant Email</Column>
              <Column style={detailValue}>{tenantEmail}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Monthly Rent</Column>
              <Column style={{ ...detailValue, color: "#16a34a", fontWeight: "700" }}>
                {formattedRent}
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={inviteLink}>
              Accept Invitation
            </Button>
            <Text style={expiry}>
              This invitation expires in <strong>7 days</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section>
            <Text style={footer}>
              If you weren't expecting this invitation, ignore this email. For
              support, contact{" "}
              <a href="mailto:support@propertyhub.ug" style={link}>
                support@propertyhub.ug
              </a>
            </Text>
            <Text style={footer}>© {new Date().getFullYear()} PropertyHub Uganda</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TenantInvite;

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
  padding: "20px 32px",
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "800",
  margin: "0",
  letterSpacing: "-0.5px",
};

const heroSection: React.CSSProperties = {
  padding: "32px 32px 24px",
};

const h1: React.CSSProperties = {
  color: "#18181b",
  fontSize: "26px",
  fontWeight: "700",
  margin: "0 0 12px",
  lineHeight: "1.2",
};

const subtext: React.CSSProperties = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
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

const ctaSection: React.CSSProperties = {
  padding: "28px 32px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#16a34a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 32px",
  textDecoration: "none",
  display: "inline-block",
};

const expiry: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  marginTop: "16px",
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
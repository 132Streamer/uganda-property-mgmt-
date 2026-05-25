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

type MaintenanceStatus =
  | "pending"
  | "in_progress"
  | "on_hold"
  | "resolved"
  | "closed";

interface MaintenanceUpdateProps {
  recipientName: string;
  propertyName: string;
  requestTitle: string;
  oldStatus: MaintenanceStatus;
  newStatus: MaintenanceStatus;
  updatedBy: string;
}

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  on_hold: "On Hold",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_COLORS: Record<MaintenanceStatus, { bg: string; text: string }> = {
  pending: { bg: "#fef9c3", text: "#854d0e" },
  in_progress: { bg: "#dbeafe", text: "#1e40af" },
  on_hold: { bg: "#fce7f3", text: "#9d174d" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
  closed: { bg: "#f4f4f5", text: "#52525b" },
};

const NEXT_STEPS: Record<MaintenanceStatus, string> = {
  pending:
    "Your request has been received. A team member will review it shortly.",
  in_progress:
    "Work has begun on your request. You'll be notified when it's resolved.",
  on_hold:
    "Your request is temporarily on hold. We'll update you once work resumes.",
  resolved:
    "Your issue has been resolved. If the problem persists, please raise a new request.",
  closed:
    "This request is now closed. Thank you for using PropertyHub maintenance.",
};

export const MaintenanceUpdate = ({
  recipientName = "Alice Nakato",
  propertyName = "Greenview Apartments",
  requestTitle = "Leaking bathroom tap",
  oldStatus = "pending",
  newStatus = "in_progress",
  updatedBy = "Property Manager",
}: MaintenanceUpdateProps) => {
  const oldLabel = STATUS_LABELS[oldStatus];
  const newLabel = STATUS_LABELS[newStatus];
  const newColor = STATUS_COLORS[newStatus];
  const nextStep = NEXT_STEPS[newStatus];

  return (
    <Html>
      <Head />
      <Preview>
        Maintenance update: "{requestTitle}" is now {newLabel}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>PropertyHub</Text>
            <Text style={headerSub}>Maintenance Update</Text>
          </Section>

          {/* Intro */}
          <Section style={introSection}>
            <Heading style={h1}>Status Update</Heading>
            <Text style={subtext}>
              Hi <strong>{recipientName}</strong>, your maintenance request has
              been updated.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Request Details */}
          <Section style={detailsSection}>
            <Text style={sectionLabel}>Request Details</Text>
            <Row style={detailRow}>
              <Column style={detailKey}>Property</Column>
              <Column style={detailValue}>{propertyName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Request</Column>
              <Column style={detailValue}>{requestTitle}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailKey}>Updated By</Column>
              <Column style={detailValue}>{updatedBy}</Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Status Change */}
          <Section style={statusSection}>
            <Text style={sectionLabel}>Status Change</Text>
            <Row style={statusRow}>
              {/* Old Status */}
              <Column style={statusCol}>
                <Text style={statusCaption}>From</Text>
                <Text
                  style={{
                    ...statusBadge,
                    backgroundColor: STATUS_COLORS[oldStatus].bg,
                    color: STATUS_COLORS[oldStatus].text,
                  }}
                >
                  {oldLabel}
                </Text>
              </Column>

              {/* Arrow */}
              <Column style={arrowCol}>
                <Text style={arrow}>→</Text>
              </Column>

              {/* New Status */}
              <Column style={statusCol}>
                <Text style={statusCaption}>To</Text>
                <Text
                  style={{
                    ...statusBadge,
                    backgroundColor: newColor.bg,
                    color: newColor.text,
                    fontWeight: "700",
                    border: `1px solid ${newColor.text}33`,
                  }}
                >
                  {newLabel}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Next Steps */}
          <Section style={nextStepSection}>
            <Text style={sectionLabel}>What's Next</Text>
            <Text style={nextStepText}>{nextStep}</Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section>
            <Text style={footer}>
              Questions? Contact{" "}
              <a href="mailto:support@propertyhub.ug" style={link}>
                support@propertyhub.ug
              </a>
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

export default MaintenanceUpdate;

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

const introSection: React.CSSProperties = {
  padding: "28px 32px 20px",
};

const h1: React.CSSProperties = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 10px",
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

const statusSection: React.CSSProperties = {
  padding: "24px 32px",
};

const statusRow: React.CSSProperties = {
  marginTop: "8px",
};

const statusCol: React.CSSProperties = {
  textAlign: "center",
  width: "42%",
};

const arrowCol: React.CSSProperties = {
  textAlign: "center",
  width: "16%",
};

const statusCaption: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const statusBadge: React.CSSProperties = {
  borderRadius: "20px",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: "600",
  padding: "6px 14px",
  margin: "0",
};

const arrow: React.CSSProperties = {
  color: "#d4d4d8",
  fontSize: "22px",
  lineHeight: "1",
  marginTop: "24px",
};

const nextStepSection: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: "#f0fdf4",
};

const nextStepText: React.CSSProperties = {
  color: "#166534",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
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
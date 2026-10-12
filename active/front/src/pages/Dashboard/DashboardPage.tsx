import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Stack,
  Tile,
  ClickableTile,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  InlineNotification,
  Button,
} from '@carbon/react';
import {
  Car,
  Home,
  User,
  ArrowRight,
  Renew,
} from '@carbon/react/icons';
import { dashboardService } from '@/services/dashboardService';
import { useAuth } from '@/context/AuthContext';
import { StatusTag } from '@/components/common/StatusTag';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/utils/validation';
import type { DashboardData, ApplicationType } from '@/types/api';
import type { ApiError } from '@/types/api';

const TYPE_LABEL: Record<ApplicationType, string> = {
  PARKING: 'Parkausweis',
  ADDRESS: 'Adressänderung',
  DOG: 'Hundeanmeldung',
};

export default function DashboardPage() {
  const { citizenId, citizenName } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!citizenId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.get(citizenId);
      setData(res);
    } catch (e) {
      setError((e as ApiError).error ?? 'Fehler beim Laden des Dashboards.');
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  useEffect(() => {
    void loadDashboard();
    setInterval(() => void loadDashboard(), 1000);
  }, [loadDashboard]);

  if (loading && !data) {
    return <LoadingState description="Dashboard-Daten werden geladen..." />;
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Dashboard konnte nicht geladen werden"
        message={error}
        onRetry={loadDashboard}
      />
    );
  }

  if (!data) return null;

  const headers = [
    { key: 'createdDate', header: 'Datum' },
    { key: 'type', header: 'Vorgang' },
    { key: 'status', header: 'Status' },
    { key: 'lastUpdated', header: 'Zuletzt geändert' },
  ];

  const rows = data.recentApplications.map((app) => ({
    id: String(app.id),
    createdDate: formatDate(app.createdDate),
    type: TYPE_LABEL[app.type] ?? app.type,
    status: app.status,
    lastUpdated: formatDate(app.lastUpdated ?? app.createdDate),
  }));

  return (
    <Stack gap={7}>
      {/* Page Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="cds--productive-heading-05" style={{ color: 'var(--cds-text-primary)' }}>
            Willkommen im Bürgerportal Musterstadt
          </h2>
          <p className="cds--body-01" style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Ihr digitales Rathaus — Übersicht über Ihre Anträge und Verwaltungsdienste
          </p>
        </div>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Renew}
          onClick={loadDashboard}
          disabled={loading}
        >
          Aktualisieren
        </Button>
      </div>

      {/* Welcome Banner */}
      <Tile
        style={{
          background: 'var(--cds-layer-01)',
          borderLeft: '4px solid var(--cds-interactive)',
          padding: '1.25rem',
        }}
      >
        <p className="cds--body-02" style={{ margin: 0, lineHeight: 1.6 }}>
          Guten Tag <strong>{citizenName ?? 'Bürger'}</strong>! Hier finden Sie eine Übersicht über Ihre laufenden
          Vorgänge bei der Stadtverwaltung Musterstadt. Sie können neue Anträge über die Schnellzugriffskarten unten oder die
          Navigation einreichen.
        </p>
      </Tile>

      {/* Statistics Section */}
      <div>
        <h3 className="cds--productive-heading-03" style={{ marginBottom: '1rem' }}>
          Übersicht: Aktuelle Zahlen
        </h3>
        <Grid narrow style={{ rowGap: '1rem' }}>
          <Column sm={2} md={2} lg={4}>
            <Tile style={{ padding: '1.25rem' }}>
              <span className="cds--label-01" style={{ color: 'var(--cds-text-secondary)' }}>Parkausweise</span>
              <p className="cds--productive-heading-06" style={{ marginTop: '0.25rem', color: 'var(--cds-link-01)' }}>
                {data.parkingPermitCount}
              </p>
            </Tile>
          </Column>
          <Column sm={2} md={2} lg={4}>
            <Tile style={{ padding: '1.25rem' }}>
              <span className="cds--label-01" style={{ color: 'var(--cds-text-secondary)' }}>Hundeanmeldungen</span>
              <p className="cds--productive-heading-06" style={{ marginTop: '0.25rem', color: 'var(--cds-link-01)' }}>
                {data.dogRegistrationCount}
              </p>
            </Tile>
          </Column>
          <Column sm={2} md={2} lg={4}>
            <Tile style={{ padding: '1.25rem' }}>
              <span className="cds--label-01" style={{ color: 'var(--cds-text-secondary)' }}>Adressänderungen</span>
              <p className="cds--productive-heading-06" style={{ marginTop: '0.25rem', color: 'var(--cds-link-01)' }}>
                {data.addressChangeCount}
              </p>
            </Tile>
          </Column>

          <Column sm={2} md={2} lg={4}>
            <Tile style={{ padding: '1.25rem', borderTop: '3px solid var(--cds-support-info)' }}>
              <span className="cds--label-01" style={{ color: 'var(--cds-text-secondary)' }}>Offene Anträge</span>
              <p className="cds--productive-heading-06" style={{ marginTop: '0.25rem', color: 'var(--cds-support-info)' }}>
                {data.pendingCount}
              </p>
            </Tile>
          </Column>
          <Column sm={2} md={2} lg={4}>
            <Tile style={{ padding: '1.25rem', borderTop: '3px solid var(--cds-support-success)' }}>
              <span className="cds--label-01" style={{ color: 'var(--cds-text-secondary)' }}>Genehmigt</span>
              <p className="cds--productive-heading-06" style={{ marginTop: '0.25rem', color: 'var(--cds-support-success)' }}>
                {data.approvedCount}
              </p>
            </Tile>
          </Column>
          <Column sm={2} md={2} lg={4}>
            <Tile style={{ padding: '1.25rem', borderTop: '3px solid var(--cds-support-error)' }}>
              <span className="cds--label-01" style={{ color: 'var(--cds-text-secondary)' }}>Abgelehnt</span>
              <p className="cds--productive-heading-06" style={{ marginTop: '0.25rem', color: 'var(--cds-support-error)' }}>
                {data.rejectedCount}
              </p>
            </Tile>
          </Column>
        </Grid>
      </div>

      {/* Quick Access Tiles */}
      <div>
        <h3 className="cds--productive-heading-03" style={{ marginBottom: '1rem' }}>
          Schnellzugriff
        </h3>
        <Grid narrow style={{ rowGap: '1rem' }}>
          <Column sm={4} md={4} lg={4}>
            <ClickableTile
              onClick={() => navigate('/parking')}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Car size={24} style={{ color: 'var(--cds-interactive)' }} />
                  <h4 className="cds--productive-heading-02">Parkausweis</h4>
                </div>
                <p className="cds--body-01" style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
                  Antrag auf Anwohner- oder Gewerbeparkausweis für Ihr Kraftfahrzeug online stellen.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cds-link-01)', fontWeight: 600 }}>
                <span>Zum Antrag</span>
                <ArrowRight size={16} />
              </div>
            </ClickableTile>
          </Column>

          <Column sm={4} md={4} lg={4}>
            <ClickableTile
              onClick={() => navigate('/address')}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Home size={24} style={{ color: 'var(--cds-interactive)' }} />
                  <h4 className="cds--productive-heading-02">Adressänderung</h4>
                </div>
                <p className="cds--body-01" style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
                  Wohnsitzwechsel oder Umzug innerhalb Musterstadt beim Einwohnermeldeamt melden.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cds-link-01)', fontWeight: 600 }}>
                <span>Zur Meldung</span>
                <ArrowRight size={16} />
              </div>
            </ClickableTile>
          </Column>

          <Column sm={4} md={4} lg={4}>
            <ClickableTile
              onClick={() => navigate('/dogs')}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <User size={24} style={{ color: 'var(--cds-interactive)' }} />
                  <h4 className="cds--productive-heading-02">Hundeanmeldung</h4>
                </div>
                <p className="cds--body-01" style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
                  Hund zur Hundesteuer anmelden, Chipnummer hinterlegen und Nachweise erfassen.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cds-link-01)', fontWeight: 600 }}>
                <span>Zur Anmeldung</span>
                <ArrowRight size={16} />
              </div>
            </ClickableTile>
          </Column>
        </Grid>
      </div>

      {/* Recent Activity Table */}
      <div>
        <TableContainer
          title="Letzte Vorgänge"
          description="Die letzten 10 Anträge und Mitteilungen Ihres Bürgerkontos"
        >
          {rows.length === 0 ? (
            <Tile style={{ padding: '2rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
              Es liegen derzeit keine aktuellen Vorgänge vor.
            </Tile>
          ) : (
            <DataTable rows={rows} headers={headers} isSortable>
              {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {tableHeaders.map((h) => (
                        <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                          {h.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'status' ? (
                              <StatusTag status={cell.value} />
                            ) : (
                              cell.value
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          )}
        </TableContainer>
      </div>

      {/* Information / Notice Box */}
      <InlineNotification
        kind="warning-alt"
        title="Hinweis:"
        subtitle="Der Bereich Hochwasserhilfe befindet sich derzeit in Entwicklung und steht demnächst zur Verfügung. Bei dringenden Hilfsanfragen wenden Sie sich bitte direkt telefonisch an das Bürgerbüro (Tel. 089-12345-0)."
        lowContrast
        hideCloseButton
      />
    </Stack>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import {
  Stack,
  Grid,
  Column,
  Form,
  FormGroup,
  TextInput,
  Search,
  Button,
  InlineNotification,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  Pagination,
  Tile,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
} from '@carbon/react';
import { User, Send, Reset, Search as SearchIcon } from '@carbon/react/icons';
import { dogService } from '@/services/dogService';
import http from '@/services/http';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/common/LoadingState';
import {
  validateDogName,
  validateChipNumber,
  formatDate,
} from '@/utils/validation';
import type { DogRegistration, ApiError } from '@/types/api';

const DOG_TAX_RATES = [
  { category: 'Erster Hund', fee: '60,00 € / Jahr', note: 'Standardtarif' },
  { category: 'Zweiter Hund (und weitere)', fee: '90,00 € / Jahr', note: 'Erhöhter Steuersatz für Mehrhaltung' },
  { category: 'Gefährliche Hunde (§ 1 KampfhundeVO)', fee: '900,00 € / Jahr', note: 'Besonderer Steuersatz' },
  { category: 'Blinden- & Assistenzhunde', fee: '0,00 € (Befreit)', note: 'Nachweis der Eignung erforderlich' },
];

export default function DogRegistrationPage() {
  const { citizenId, citizenName } = useAuth();
  const [registrations, setRegistrations] = useState<DogRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [chipNumber, setChipNumber] = useState('');

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<{ dogName?: string; chipNumber?: string }>({});

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const loadRegistrations = useCallback(async () => {
    if (!citizenId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dogService.getRegistrations(citizenId);
      setRegistrations(data);
    } catch (e) {
      setError((e as ApiError).error ?? 'Fehler beim Laden der Hunderegistrierungen.');
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!citizenId) return;
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      if (!searchTerm.trim()) {
        const data = await dogService.getRegistrations(citizenId);
        setRegistrations(data);
      } else {
        const data = await dogService.search(citizenId, searchTerm.trim());
        setRegistrations(data);
      }
    } catch (e) {
      setError((e as ApiError).error ?? 'Fehler bei der Hundesuche.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchTerm('');
    if (!citizenId) return;
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const data = (await http.get<DogRegistration[]>(`/dogs/${citizenId}`)).data;
      setRegistrations(data);
    } catch (e) {
      setError((e as ApiError).error ?? 'Fehler beim Zurücksetzen der Suche.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDogName('');
    setBreed('');
    setChipNumber('');
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenId) return;

    // Validate fields
    const nameErr = validateDogName(dogName);
    const chipErr = validateChipNumber(chipNumber);

    if (nameErr || chipErr) {
      setFieldErrors({
        dogName: nameErr ?? undefined,
        chipNumber: chipErr ?? undefined,
      });
      setError('Bitte korrigieren Sie die markierten Eingabefelder.');
      return;
    }

    setFieldErrors({});
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await dogService.register(citizenId, {
        dogName: dogName.trim(),
        breed: breed.trim() || undefined,
        chipNumber: chipNumber.trim() || undefined,
      });

      setSuccess(`Hund "${dogName.trim()}" wurde erfolgreich angemeldet.`);
      handleReset();
      const updated = await dogService.getRegistrations(citizenId);
      setRegistrations(updated);
    } catch (e) {
      setError((e as ApiError).error ?? 'Hunderegistrierung konnte nicht abgeschlossen werden.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && registrations.length === 0) {
    return <LoadingState description="Hunderegistrierungs-Dienste werden geladen..." />;
  }

  const headers = [
    { key: 'id', header: 'Reg.-Nr.' },
    { key: 'dogName', header: 'Hundename' },
    { key: 'breed', header: 'Rasse' },
    { key: 'registrationDate', header: 'Anmeldedatum' },
    { key: 'chipNumber', header: 'Chip-Nummer' },
  ];

  const allRows = registrations.map((r) => ({
    id: String(r.id),
    dogName: r.dogName,
    breed: r.breed ?? '—',
    registrationDate: formatDate(r.registrationDate),
    chipNumber: r.chipNumber ?? '—',
  }));

  // Pagination slice
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = allRows.slice(startIndex, startIndex + pageSize);

  return (
    <Stack gap={7}>
      {/* Header */}
      <div>
        <h2 className="cds--productive-heading-05" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={28} style={{ color: 'var(--cds-interactive)' }} />
          Hundeanmeldung
        </h2>
        <p className="cds--body-01" style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          Melden Sie Ihren Hund bei der Stadtverwaltung Musterstadt an.
          Die Hundesteuerpflicht entsteht mit dem Tag der Anmeldung.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <InlineNotification
          kind="error"
          title="Fehler:"
          subtitle={error}
          lowContrast
          onCloseButtonClick={() => setError(null)}
        />
      )}
      {success && (
        <InlineNotification
          kind="success"
          title="Erfolg:"
          subtitle={<span dangerouslySetInnerHTML={{ __html: success }} />}
          lowContrast
          onCloseButtonClick={() => setSuccess(null)}
        />
      )}

      {/* Main Grid: Form + Tax Guide */}
      <Grid narrow style={{ rowGap: '2rem' }}>
        <Column sm={4} md={8} lg={8}>
          <Tile style={{ padding: '1.5rem' }}>
            <h3 className="cds--productive-heading-03" style={{ marginBottom: '1.25rem' }}>
              Hund anmelden
            </h3>
            <Form onSubmit={handleSubmit}>
              <FormGroup legendText="">
                <Stack gap={5}>
                  <TextInput
                    id="dogName"
                    labelText="Hundename *"
                    placeholder="z. B. Bello, Luna"
                    value={dogName}
                    onChange={(e) => {
                      setDogName(e.target.value);
                      if (fieldErrors.dogName) setFieldErrors((prev) => ({ ...prev, dogName: undefined }));
                    }}
                    invalid={!!fieldErrors.dogName}
                    invalidText={fieldErrors.dogName}
                    maxLength={100}
                    required
                  />

                  <TextInput
                    id="breed"
                    labelText="Rasse (optional)"
                    placeholder="z. B. Schäferhund, Labrador, Dackel"
                    helperText="Rasse oder Mischlingsangabe"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    maxLength={100}
                  />

                  {/* Readonly Owner Field */}
                  <TextInput
                    id="owner"
                    labelText="Halter / Besitzer"
                    value={`${citizenName ?? 'Hans Müller'} (Angemeldeter Bürger)`}
                    readOnly
                    helperText="Die Registrierung erfolgt auf den aktuell angemeldeten Bürger."
                  />

                  <TextInput
                    id="chipNumber"
                    labelText="Chip-Nummer (optional)"
                    placeholder="15-stellige ISO-Chipnummer (z. B. 276098100123456)"
                    helperText="15-stellig nach ISO 11784 Standard"
                    value={chipNumber}
                    onChange={(e) => {
                      setChipNumber(e.target.value);
                      if (fieldErrors.chipNumber) setFieldErrors((prev) => ({ ...prev, chipNumber: undefined }));
                    }}
                    invalid={!!fieldErrors.chipNumber}
                    invalidText={fieldErrors.chipNumber}
                    maxLength={50}
                  />

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <Button
                      type="submit"
                      disabled={submitting}
                      renderIcon={Send}
                    >
                      {submitting ? 'Hund wird angemeldet...' : 'Hund anmelden'}
                    </Button>
                    <Button
                      kind="secondary"
                      type="button"
                      disabled={submitting}
                      renderIcon={Reset}
                      onClick={handleReset}
                    >
                      Zurücksetzen
                    </Button>
                  </div>
                </Stack>
              </FormGroup>
            </Form>
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={8}>
          <Tile style={{ padding: '1.5rem', background: 'var(--cds-layer-01)' }}>
            <h3 className="cds--productive-heading-03" style={{ marginBottom: '1rem' }}>
              Hundesteuer-Information &amp; Tarife
            </h3>
            <StructuredListWrapper isCondensed>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>Kategorie</StructuredListCell>
                  <StructuredListCell head>Steuersatz</StructuredListCell>
                  <StructuredListCell head>Hinweis</StructuredListCell>
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {DOG_TAX_RATES.map((item) => (
                  <StructuredListRow key={item.category}>
                    <StructuredListCell><strong>{item.category}</strong></StructuredListCell>
                    <StructuredListCell>{item.fee}</StructuredListCell>
                    <StructuredListCell style={{ color: 'var(--cds-text-secondary)', fontSize: '0.8125rem' }}>
                      {item.note}
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--cds-border-subtle)',
                fontSize: '0.8125rem',
                color: 'var(--cds-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Wichtige Hinweise zur Hundesteuer:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, listStyleType: 'disc' }}>
                <li>Steuermarke wird nach Bearbeitung postalisch zugestellt.</li>
                <li>Bei Abmeldung oder Halterwechsel ist das Bürgeramt binnen 14 Tagen zu informieren.</li>
                <li>Halter von Listenhunden benötigen vorab ein behördliches Negativzeugnis.</li>
              </ul>
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Search & Dogs Table */}
      <div>
        <TableContainer
          title="Meine registrierten Hunde"
          description="Übersicht aller auf Sie angemeldeten Hunde mit Filter- und Suchfunktion"
        >
          <TableToolbar>
            <TableToolbarContent>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                <Search
                  id="dog-search-input"
                  labelText="Registrierte Hunde suchen"
                  placeholder="Nach Hundename oder Rasse suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={handleClearSearch}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSearch();
                    }
                  }}
                  size="md"
                />
                <Button
                  kind="secondary"
                  size="md"
                  renderIcon={SearchIcon}
                  onClick={() => void handleSearch()}
                >
                  Suchen
                </Button>
                {searchTerm && (
                  <Button
                    kind="ghost"
                    size="md"
                    onClick={handleClearSearch}
                  >
                    Filter aufheben
                  </Button>
                )}
              </div>
            </TableToolbarContent>
          </TableToolbar>

          {allRows.length === 0 ? (
            <Tile style={{ padding: '2rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
              Keine Hunde registriert oder kein Suchergebnis gefunden.
            </Tile>
          ) : (
            <>
              <DataTable rows={paginatedRows} headers={headers} isSortable>
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
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </DataTable>
              <Pagination
                backwardText="Vorherige Seite"
                forwardText="Nächste Seite"
                itemsPerPageText="Einträge pro Seite:"
                page={page}
                pageNumberText="Seitennummer"
                pageSize={pageSize}
                pageSizes={[5, 10, 25]}
                totalItems={allRows.length}
                onChange={({ page: newPage, pageSize: newPageSize }) => {
                  setPage(newPage);
                  setPageSize(newPageSize);
                }}
              />
            </>
          )}
        </TableContainer>
      </div>
    </Stack>
  );
}

package com.musterstadt.service;

import com.musterstadt.dao.CitizenDao;
import com.musterstadt.dao.DogRegistrationDao;
import com.musterstadt.model.Citizen;
import com.musterstadt.model.DogRegistration;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Date;
import java.util.List;
import java.util.logging.Logger;

@ApplicationScoped
public class DogRegistrationService {

    private static final Logger LOGGER = Logger.getLogger(DogRegistrationService.class.getName());

    @Inject
    DogRegistrationDao dogRegistrationDao;

    @Inject
    CitizenDao citizenDao;

    @Transactional
    public DogRegistration register(Long a, String b, String c, String d) {
        // TODO: Validate chip number format (15-digit ISO 11784)
        DogRegistration r = null;
        if (b != null) {
            if (!b.trim().isEmpty()) {
                Citizen x = citizenDao.findById(a);
                if (x != null) {
                    r = new DogRegistration(x, b.trim(), c, new Date(), d);
                    dogRegistrationDao.save(r);
                    LOGGER.info("Hund angemeldet: " + b + " (" + c + ") für Bürger=" + a);
                } else {
                    throw new IllegalArgumentException("Bürger nicht gefunden: " + a);
                }
            } else {
                throw new IllegalArgumentException("Hundename darf nicht leer sein.");
            }
        } else {
            throw new IllegalArgumentException("Hundename darf nicht leer sein.");
        }
        return r;
    }

    @Transactional
    public DogRegistration update(Long citizenId, Long registrationId, String dogName, String breed) {
        // TODO: Add environmental permit support for certain breeds
        DogRegistration reg = dogRegistrationDao.findByCitizenId(citizenId).stream()
                .filter(d -> d.getId().equals(registrationId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Anmeldung nicht gefunden oder nicht Ihr Eintrag: " + registrationId));

        reg.setDogName(dogName);
        reg.setBreed(breed);
        return dogRegistrationDao.update(reg);
    }

    /**
     * Free-text search across dog name and breed, scoped to the logged-in citizen.
     * Uses JPQL LIKE — case-insensitive, no full-text index.
     */
    public List<DogRegistration> search(Long citizenId, String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return dogRegistrationDao.findByCitizenId(citizenId);
        }
        return dogRegistrationDao.searchByNameOrBreedForCitizen(citizenId, searchTerm.trim());
    }

    public List<DogRegistration> getAllRegistrations(Long citizenId) {
        return dogRegistrationDao.findByCitizenId(citizenId);
    }
}

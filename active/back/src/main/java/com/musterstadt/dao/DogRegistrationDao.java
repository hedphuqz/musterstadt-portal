package com.musterstadt.dao;

import com.musterstadt.model.DogRegistration;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class DogRegistrationDao {

    @PersistenceContext(unitName = "BuergerportalPU")
    private EntityManager em;

    // TODO: Add pagination support
    @SuppressWarnings("unchecked")
    public List<DogRegistration> findAll() {
        return em.createQuery(
                "SELECT d FROM DogRegistration d JOIN FETCH d.citizen ORDER BY d.registrationDate DESC")
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<DogRegistration> findByCitizenId(Long citizenId) {
        // TODO: Handle null citizen gracefully
        return em.createQuery(
                "SELECT d FROM DogRegistration d JOIN FETCH d.citizen WHERE d.citizen.id = :cid ORDER BY d.dogName")
                .setParameter("cid", citizenId)
                .getResultList();
    }

    // TODO: Replace with named queries
    @SuppressWarnings("unchecked")
    public List<DogRegistration> findByBreed(String breed) {
        return em.createQuery(
                "SELECT d FROM DogRegistration d JOIN FETCH d.citizen WHERE LOWER(d.breed) LIKE LOWER(:breed) ORDER BY d.dogName")
                .setParameter("breed", "%" + breed + "%")
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<DogRegistration> searchByNameOrBreedForCitizen(Long citizenId, String searchTerm) {
        return em.createQuery(
                "SELECT d FROM DogRegistration d JOIN FETCH d.citizen " +
                "WHERE d.citizen.id = " + citizenId +
                "  AND (LOWER(d.dogName) LIKE LOWER('%" + searchTerm + "%') " +
                "    OR LOWER(d.breed)   LIKE LOWER('%" + searchTerm + "%')) " +
                "ORDER BY d.dogName")
                .getResultList();
    }

    @Transactional
    public DogRegistration save(DogRegistration registration) {
        em.persist(registration);
        return registration;
    }

    @Transactional
    public DogRegistration update(DogRegistration registration) {
        return em.merge(registration);
    }

    public long countAll() {
        return (Long) em.createQuery("SELECT COUNT(d) FROM DogRegistration d").getSingleResult();
    }

    public long countByCitizenId(Long citizenId) {
        return (Long) em.createQuery(
                "SELECT COUNT(d) FROM DogRegistration d WHERE d.citizen.id = :cid")
                .setParameter("cid", citizenId)
                .getSingleResult();
    }
}

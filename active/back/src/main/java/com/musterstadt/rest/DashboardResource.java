package com.musterstadt.rest;

import com.musterstadt.dao.ApplicationDao;
import com.musterstadt.dao.CitizenDao;
import com.musterstadt.dao.DogRegistrationDao;
import com.musterstadt.dao.ParkingPermitDao;
import com.musterstadt.dto.ApplicationDto;
import com.musterstadt.model.Application.ApplicationStatus;
import com.musterstadt.model.Application.ApplicationType;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Dashboard resource — mirrors DashboardBean (RequestScoped).
 *
 * GET /api/dashboard/{citizenId}
 *   Returns aggregated stats and recent 10 applications for the citizen.
 */
@Path("/api/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Dashboard", description = "Aggregated statistics and recent activity")
public class DashboardResource {

    @Inject ApplicationDao applicationDao;
    @Inject CitizenDao citizenDao;
    @Inject DogRegistrationDao dogRegistrationDao;
    @Inject ParkingPermitDao parkingPermitDao;

    @GET
    @Path("/{citizenId}")
    @Operation(
        summary = "Get dashboard data",
        description = "Returns permit counts, application status summary, and recent 10 applications for the given citizen."
    )
    public Response getDashboard(@PathParam("citizenId") Long citizenId) {
        if (citizenDao.findById(citizenId) == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Bürger nicht gefunden: " + citizenId))
                    .build();
        }

        long totalApplications = applicationDao.findByCitizenId(citizenId).size();

        long pendingCount  = applicationDao.findByCitizenId(citizenId).stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
        long approvedCount = applicationDao.findByCitizenId(citizenId).stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
        long rejectedCount = applicationDao.findByCitizenId(citizenId).stream()
                .filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();

        long parkingCount = applicationDao.findByCitizenId(citizenId).stream()
                .filter(a -> a.getType() == ApplicationType.PARKING).count();
        long addressCount = applicationDao.findByCitizenId(citizenId).stream()
                .filter(a -> a.getType() == ApplicationType.ADDRESS).count();
        long dogCount     = dogRegistrationDao.findByCitizenId(citizenId).size();

        List<ApplicationDto> recentApplications = applicationDao
                .findRecentApplicationsByCitizen(citizenId, 10)
                .stream()
                .map(ApplicationDto::from)
                .collect(Collectors.toList());

        Map<String, Object> body = Map.of(
            "citizenId",          citizenId,
            "totalApplications",  totalApplications,
            "pendingCount",       pendingCount,
            "approvedCount",      approvedCount,
            "rejectedCount",      rejectedCount,
            "parkingPermitCount", parkingCount,
            "addressChangeCount", addressCount,
            "dogRegistrationCount", dogCount,
            "recentApplications", recentApplications
        );

        return Response.ok(body).build();
    }
}

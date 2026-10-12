package com.musterstadt.rest;

import com.musterstadt.dto.DogRegistrationDto;
import com.musterstadt.model.DogRegistration;
import com.musterstadt.service.DogRegistrationService;
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
 * Dog registration resource — mirrors DogRegistrationBean (RequestScoped in legacy).
 *
 * Business rules preserved from architecture.md §4.4:
 *  - dogName required (non-empty)
 *  - chipNumber format (15-digit ISO 11784) NOT validated (kept as legacy TODO)
 *  - search: free-text LIKE across dogName and breed, scoped to citizenId
 */
@Path("/api/dogs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Dog Registrations", description = "Dog registration management")
public class DogResource {

    @Inject
    DogRegistrationService dogRegistrationService;

    @Inject
    com.musterstadt.dao.DogRegistrationDao dogRegistrationDao;

    // ── DTOs ────────────────────────────────────────────────────────────────

    public static class RegisterDogRequest {
        public String dogName;
        public String breed;
        public String chipNumber;
    }

    public static class UpdateDogRequest {
        public String dogName;
        public String breed;
    }

    // ── Endpoints ───────────────────────────────────────────────────────────

    @GET
    @Path("/{citizenId}")
    @Operation(summary = "List all dog registrations for a citizen",
               description = "Returns all registered dogs belonging to the given citizen.")
    public Response getRegistrations(@PathParam("citizenId") Long citizenId) {
        List<DogRegistration> regs = dogRegistrationDao.findByCitizenId(citizenId);
        List<DogRegistrationDto> dtos = regs.stream()
                .map(DogRegistrationDto::from)
                .collect(Collectors.toList());
        return Response.ok(dtos).build();
    }

    @GET
    @Path("/{citizenId}/search")
    @Operation(summary = "Search dog registrations",
               description = "Free-text search across dogName and breed using LIKE, scoped to the given citizen.")
    public Response search(@PathParam("citizenId") Long citizenId,
                           @QueryParam("q") String searchTerm) {
        List<DogRegistration> regs = dogRegistrationService.search(citizenId, searchTerm);
        List<DogRegistrationDto> dtos = regs.stream()
                .map(DogRegistrationDto::from)
                .collect(Collectors.toList());
        return Response.ok(dtos).build();
    }

    @POST
    @Path("/{citizenId}")
    @Operation(summary = "Register a new dog",
               description = "Creates a new dog registration for the given citizen. dogName is required.")
    public Response registerDog(@PathParam("citizenId") Long citizenId,
                                RegisterDogRequest req) {
        if (req == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Request body fehlt."))
                    .build();
        }
        DogRegistration reg = dogRegistrationService.register(
                citizenId, req.dogName, req.breed, req.chipNumber);
        return Response.status(Response.Status.CREATED)
                .entity(DogRegistrationDto.from(reg))
                .build();
    }

    @PUT
    @Path("/{citizenId}/{registrationId}")
    @Operation(summary = "Update a dog registration",
               description = "Updates dogName and breed for an existing registration owned by the given citizen.")
    public Response updateDog(@PathParam("citizenId") Long citizenId,
                              @PathParam("registrationId") Long registrationId,
                              UpdateDogRequest req) {
        if (req == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Request body fehlt."))
                    .build();
        }
        DogRegistration updated = dogRegistrationService.update(
                citizenId, registrationId, req.dogName, req.breed);
        return Response.ok(DogRegistrationDto.from(updated)).build();
    }
}

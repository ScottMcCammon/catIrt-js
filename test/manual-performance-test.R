# R-equivalent to "manual-performance-test.js" for performance comparison
#
# run via: R --no-save < manual-performance-test.R

library(catIrt)
load(file="../data/mocca-items.RData") # creates "itembank" var
respbank <- c(1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3)

resp2binary <- function(x) if (x == 2) 1 else 0

resp2phase2 <- function(r) {
  if (r == 2) {
    return(NA)
  }
  else if (r == 1) {
    return(1)
  }
  else {
    return(0)
  }
}

begTime <- Sys.time()
i <- 1
while (TRUE) {
  # create 1-40 random responses and items
  rows <- sample(nrow(itembank))
  itembank <- itembank[rows,]
  n <- sample(1:40, 1)
  resp <- sample(respbank, n)
  useditems <- itembank[1:n,, drop=FALSE]
  fromitems <- itembank[-(1:n),]

  # theta1 scoring (limited to first 25 responses)
  res1 <- wleEst(sapply(head(resp, 25), resp2binary), head(useditems[,2:4], 25), mod="brm")

  # phase1 item selection
  if (n < 25) {
    sel <- itChoose(fromitems[,1:4], mod="brm", select="UW-FI", at="theta", cat_theta=res1$theta)
  }

  # theta2 scoring
  res2 <- wleEst(sapply(resp, resp2phase2), useditems[,5:7], mod="brm")

  # phase2 item selection
  if (n >= 25) {
    sel <- itChoose(cbind(fromitems[,1], fromitems[,5:7]), mod="brm", select="UW-FI-Modified", at="theta", cat_theta=res2$theta, phase1_params=useditems[1:25, 5:7], phase1_est_theta=res1$theta)
  }

  # performance metrics
  if ((i %% 10000) == 0) {
    endTime <- Sys.time()
    print(paste0("iteration ", i, ": rate: ", floor(i / as.numeric(endTime - begTime, units="secs")), " iter/s"))
  }

  i <- i + 1
}
